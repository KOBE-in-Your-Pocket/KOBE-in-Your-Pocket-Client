import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

import {
  clampIconCropTransform,
  computeIconCropRect,
  getMaxIconZoom,
  INITIAL_ICON_CROP_TRANSFORM,
  isUsableIconImageSize,
  zoomIconCropTransform,
  type IconCropRect,
} from '../../domain/icon-crop';
import { useWheel } from '../hooks/use-wheel';

import type { PickedProfileIconImage } from '../../application/pick-profile-icon';

const CONFIRM_BUTTON_COLOR = '#D45B45';
const MASK_COLOR = 'rgba(0, 0, 0, 0.6)';
const FRAME_BORDER_COLOR = '#FFFFFF';
const FRAME_BORDER_WIDTH = 2;
/** 切り抜き枠の一辺の上限（pt）。タブレットなどで枠が大きくなりすぎないようにする。 */
const MAX_FRAME_SIZE = 320;
/** 画面の高さに対する切り抜き枠の一辺の上限。ヘッダーや説明文の場所を残す。 */
const MAX_FRAME_HEIGHT_RATIO = 0.6;
/** 指を離したあと、範囲内へ戻すアニメーションの時間（ms）。 */
const SETTLE_DURATION_MS = 200;
/** 操作中に縮められる下限（cover 相当からの倍率）。指を離すと 1 に戻る。 */
const MIN_GESTURE_ZOOM = 0.5;
/** 操作中に拡大できる上限の、本来の上限に対する比率。指を離すと上限に戻る。 */
const GESTURE_ZOOM_OVERSHOOT = 1.5;
/** 「＋」「−」ボタンやスクリーンリーダーの操作 1 回で変える倍率。 */
const ZOOM_STEP = 0.5;
/** マウスホイールの回転量（px）を倍率の変化に直す係数。100px で約 1.2 倍になる。 */
const WHEEL_ZOOM_SENSITIVITY = 0.002;

export type IconCropScreenProps = {
  /** 選んだ画像。寸法を取得できなかった場合は 0 になりうる。 */
  image: PickedProfileIconImage;
  /**
   * 決定したとき、枠の中に見えている部分の切り抜き範囲（元画像の px）を返す。
   * 寸法を取得できない画像では null（`cropProfileIcon` がそのまま受け取れる）。
   */
  onConfirm: (crop: IconCropRect | null) => void;
  /** キャンセルしたとき。元画像の削除は呼び出し側で行う。 */
  onCancel: () => void;
};

/**
 * アイコンにする範囲を、ドラッグ（位置）とピンチ（大きさ）で調整する画面（#718）。
 * Web ではピンチの代わりに、「＋」「−」ボタンとマウスホイールで大きさを変える（#719）。
 *
 * 操作中は枠の外へはみ出せるが、指を離すと `clampIconCropTransform` で
 * 枠の中に余白ができない位置・大きさへアニメーションで戻す。
 * Modal の中でもジェスチャーを受け取れるよう、画面自身を GestureHandlerRootView で包む。
 */
export function IconCropScreen({ image, onConfirm, onCancel }: IconCropScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const window = useWindowDimensions();
  const [confirmed, setConfirmed] = useState(false);
  // ボタンの有効・無効を決めるための倍率。アニメーションの行き先（範囲内に収めた値）を持つ。
  const [zoom, setZoom] = useState(INITIAL_ICON_CROP_TRANSFORM.scale);
  const areaRef = useRef<View>(null);
  // Web ではピンチが使えないため、拡大・縮小のボタンとマウスホイールで大きさを変える（#719）。
  const showsZoomButtons = Platform.OS === 'web';

  const frameSize = Math.min(
    window.width - Spacing.four * 2,
    window.height * MAX_FRAME_HEIGHT_RATIO,
    MAX_FRAME_SIZE,
  );
  const usable = isUsableIconImageSize(image);
  // cover 相当（倍率 1）のときの表示寸法。
  const baseScale = usable ? frameSize / Math.min(image.width, image.height) : 1;
  const imageStyle = usable
    ? { width: image.width * baseScale, height: image.height * baseScale }
    : { width: frameSize, height: frameSize };
  // マスクの枠線の太さ。画面のどこまで操作エリアが広がっても外側を覆いきれる太さにする。
  const maskBorder = Math.max(window.width, window.height);
  const maxZoom = getMaxIconZoom(image);

  const scale = useSharedValue(INITIAL_ICON_CROP_TRANSFORM.scale);
  const translateX = useSharedValue(INITIAL_ICON_CROP_TRANSFORM.translateX);
  const translateY = useSharedValue(INITIAL_ICON_CROP_TRANSFORM.translateY);
  const panActive = useSharedValue(false);
  const pinchActive = useSharedValue(false);
  // 前回のイベントでの累積値。差分を足していくことで、パンとピンチを同時に効かせる。
  const lastPanX = useSharedValue(0);
  const lastPanY = useSharedValue(0);
  const lastPinchScale = useSharedValue(1);
  // 操作エリアの中心。ピンチの中心（focal）を枠の中心からの位置に直すのに使う。
  const areaCenterX = useSharedValue(0);
  const areaCenterY = useSharedValue(0);

  // ジェスチャーがすべて終わったら、枠の中に余白ができない位置・大きさへ戻す。
  // 片方だけ終わった時点で戻すと、もう一方の操作中に画像が跳ねる。
  const settleIfIdle = () => {
    'worklet';
    if (panActive.get() || pinchActive.get()) {
      return;
    }
    const clamped = clampIconCropTransform(
      { scale: scale.get(), translateX: translateX.get(), translateY: translateY.get() },
      image,
      frameSize,
    );
    const config = { duration: SETTLE_DURATION_MS };
    scale.set(withTiming(clamped.scale, config));
    translateX.set(withTiming(clamped.translateX, config));
    translateY.set(withTiming(clamped.translateY, config));
    scheduleOnRN(setZoom, clamped.scale);
  };

  const pan = Gesture.Pan()
    .withTestId('icon-crop-pan')
    .enabled(usable)
    .onStart(() => {
      panActive.set(true);
      lastPanX.set(0);
      lastPanY.set(0);
    })
    .onUpdate((event) => {
      translateX.set(translateX.get() + event.translationX - lastPanX.get());
      translateY.set(translateY.get() + event.translationY - lastPanY.get());
      lastPanX.set(event.translationX);
      lastPanY.set(event.translationY);
    })
    .onFinalize(() => {
      panActive.set(false);
      settleIfIdle();
    });

  const pinch = Gesture.Pinch()
    .withTestId('icon-crop-pinch')
    .enabled(usable)
    .onStart(() => {
      pinchActive.set(true);
      lastPinchScale.set(1);
    })
    .onUpdate((event) => {
      const previous = scale.get();
      const maxZoom = getMaxIconZoom(image) * GESTURE_ZOOM_OVERSHOOT;
      const requested = (previous * event.scale) / lastPinchScale.get();
      const next = Math.min(Math.max(requested, MIN_GESTURE_ZOOM), maxZoom);
      lastPinchScale.set(event.scale);

      // 指の中点の下にある画像の位置が動かないよう、拡大に合わせて移動量も変える。
      const ratio = next / previous;
      const focalX = event.focalX - areaCenterX.get();
      const focalY = event.focalY - areaCenterY.get();
      translateX.set(focalX - (focalX - translateX.get()) * ratio);
      translateY.set(focalY - (focalY - translateY.get()) * ratio);
      scale.set(next);
    })
    .onFinalize(() => {
      pinchActive.set(false);
      settleIfIdle();
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
    ],
  }));

  /** 枠の中心に見えている部分を保ったまま、倍率を `nextScale` に変える（範囲内に収める）。 */
  function zoomTo(nextScale: number, animated: boolean) {
    const next = zoomIconCropTransform(
      { scale: scale.get(), translateX: translateX.get(), translateY: translateY.get() },
      nextScale,
      image,
      frameSize,
    );
    if (animated) {
      const config = { duration: SETTLE_DURATION_MS };
      scale.set(withTiming(next.scale, config));
      translateX.set(withTiming(next.translateX, config));
      translateY.set(withTiming(next.translateY, config));
    } else {
      scale.set(next.scale);
      translateX.set(next.translateX);
      translateY.set(next.translateY);
    }
    setZoom(next.scale);
  }

  // 続けて押したときにアニメーション途中の値から足さないよう、行き先の倍率から変える。
  const zoomIn = () => zoomTo(zoom + ZOOM_STEP, true);
  const zoomOut = () => zoomTo(zoom - ZOOM_STEP, true);
  const canZoomIn = usable && zoom < maxZoom;
  const canZoomOut = usable && zoom > 1;

  // ホイールは細かく何度も届くので、アニメーションせずにそのまま追従させる。
  // 下へ回す（deltaY > 0）と縮小、上へ回すと拡大する。
  useWheel(
    areaRef,
    (deltaY) => zoomTo(scale.get() * Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY), false),
    usable,
  );

  function handleConfirm() {
    if (confirmed) {
      return;
    }
    setConfirmed(true);
    // 戻しのアニメーション中でも、computeIconCropRect の中で範囲内に収めてから計算するので、
    // 戻り切ったあとの枠の中と同じ範囲になる。
    onConfirm(
      computeIconCropRect(
        { scale: scale.get(), translateX: translateX.get(), translateY: translateY.get() },
        image,
        frameSize,
      ),
    );
  }

  const hint = showsZoomButtons
    ? t('settings.accountEdit.iconCrop.hintWeb')
    : t('settings.accountEdit.iconCrop.hint');

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.cancel')}
            onPress={onCancel}
            hitSlop={Spacing.two}
            style={styles.headerButton}
          >
            <ThemedText type="default">{t('settings.cancel')}</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">{t('settings.accountEdit.iconCrop.title')}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.accountEdit.iconCrop.confirm')}
            accessibilityState={{ disabled: confirmed }}
            disabled={confirmed}
            onPress={handleConfirm}
            style={[styles.headerButton, styles.confirmButton]}
          >
            <ThemedText type="smallBold" style={styles.confirmText}>
              {t('settings.accountEdit.iconCrop.confirm')}
            </ThemedText>
          </Pressable>
        </View>

        <GestureDetector gesture={gesture}>
          <View
            ref={areaRef}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={t('settings.accountEdit.iconCrop.areaLabel')}
            accessibilityHint={hint}
            // ピンチできないスクリーンリーダーの利用者も、上下のスワイプで大きさを変えられる。
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment') {
                zoomIn();
              } else if (event.nativeEvent.actionName === 'decrement') {
                zoomOut();
              }
            }}
            style={styles.area}
            onLayout={(event) => {
              areaCenterX.set(event.nativeEvent.layout.width / 2);
              areaCenterY.set(event.nativeEvent.layout.height / 2);
            }}
          >
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
              <Animated.View style={[imageStyle, animatedImageStyle]}>
                <Image source={{ uri: image.uri }} style={imageStyle} contentFit="cover" />
              </Animated.View>
            </View>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
              {/* 太い枠線を持つ円で、内側に枠と同じ大きさの丸い穴が開いたマスクを作る。 */}
              <View
                style={{
                  width: frameSize + maskBorder * 2,
                  height: frameSize + maskBorder * 2,
                  borderRadius: frameSize / 2 + maskBorder,
                  borderWidth: maskBorder,
                  borderColor: MASK_COLOR,
                }}
              />
            </View>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
              <View
                style={{
                  width: frameSize,
                  height: frameSize,
                  borderRadius: frameSize / 2,
                  borderWidth: FRAME_BORDER_WIDTH,
                  borderColor: FRAME_BORDER_COLOR,
                }}
              />
            </View>
          </View>
        </GestureDetector>

        {showsZoomButtons ? (
          <View style={styles.zoomButtons}>
            <ZoomButton
              label={t('settings.accountEdit.iconCrop.zoomOut')}
              symbol={{ ios: 'minus', android: 'remove', web: 'remove' }}
              enabled={canZoomOut}
              onPress={zoomOut}
            />
            <ZoomButton
              label={t('settings.accountEdit.iconCrop.zoomIn')}
              symbol={{ ios: 'plus', android: 'add', web: 'add' }}
              enabled={canZoomIn}
              onPress={zoomIn}
            />
          </View>
        ) : null}

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {hint}
        </ThemedText>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

/** 拡大・縮小のボタン（Web のみ）。 */
function ZoomButton({
  label,
  symbol,
  enabled,
  onPress,
}: {
  label: string;
  symbol: SymbolViewProps['name'];
  enabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={[styles.zoomButton, { backgroundColor: theme.backgroundElement }]}
    >
      <SymbolView name={symbol} tintColor={enabled ? theme.text : theme.textSecondary} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  headerButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  confirmButton: {
    backgroundColor: CONFIRM_BUTTON_COLOR,
  },
  confirmText: {
    color: '#FFFFFF',
  },
  area: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
