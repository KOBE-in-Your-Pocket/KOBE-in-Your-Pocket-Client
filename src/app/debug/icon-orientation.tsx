import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

/** 結果の画像を並べて表示するときの一辺（pt）。 */
const PREVIEW_EDGE = 140;

type Inspection = {
  sourceUri: string;
  picker: { width: number; height: number };
  exifOrientation: string;
  manipulator: { width: number; height: number };
  crop: { uri: string; width: number; height: number };
};

/**
 * 回転情報（EXIF Orientation）付きの写真で、ImagePicker が返す寸法と
 * ImageManipulator が読み込んだ画像の寸法・向きが一致するかを確かめる（#715）。
 *
 * ピッカーの寸法を基準に左上 1/4 を切り抜くので、切り抜き結果が元画像の
 * 左上と同じ見た目なら、アイコン調整画面（#714）の座標計算をそのまま使える。
 */
export default function IconOrientationDebugScreen() {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  async function handlePick() {
    setPicking(true);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        exif: true,
      });
      if (result.canceled || result.assets.length === 0) {
        return;
      }
      setInspection(await inspect(result.assets[0]));
    } catch (e) {
      setInspection(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPicking(false);
    }
  }

  const matches =
    inspection != null &&
    inspection.picker.width === inspection.manipulator.width &&
    inspection.picker.height === inspection.manipulator.height;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Icon orientation</ThemedText>
          <ThemedText type="small">
            縦向きで撮った写真など、回転情報付きの画像を選んでください。
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            disabled={picking}
            onPress={handlePick}
            style={styles.button}
          >
            <ThemedText type="linkPrimary">写真を選ぶ</ThemedText>
          </Pressable>

          {error ? <ThemedText type="code">{error}</ThemedText> : null}

          {inspection ? (
            <>
              <ThemedView type="backgroundElement" style={styles.card}>
                <Row label="EXIF Orientation" value={inspection.exifOrientation} />
                <Row label="picker w×h" value={formatSize(inspection.picker)} />
                <Row label="manipulator w×h" value={formatSize(inspection.manipulator)} />
                <Row label="crop w×h" value={formatSize(inspection.crop)} />
                <Row label="寸法一致" value={matches ? 'OK' : 'NG'} />
              </ThemedView>

              <ThemedText type="small">
                左：元画像（expo-image で表示）／右：ピッカーの寸法で計算した左上 1/4
              </ThemedText>
              <ThemedView style={styles.previews}>
                <Image
                  source={{ uri: inspection.sourceUri }}
                  style={styles.preview}
                  contentFit="contain"
                />
                <Image
                  source={{ uri: inspection.crop.uri }}
                  style={styles.preview}
                  contentFit="contain"
                />
              </ThemedView>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

async function inspect(asset: ImagePicker.ImagePickerAsset): Promise<Inspection> {
  const loaded = await ImageManipulator.manipulate(asset.uri).renderAsync();

  // ピッカーは寸法を取得できないと 0 を返す。そのまま切り抜くと幅 0 の矩形になって
  // 失敗するため、読み込み後の寸法で代用する（表では寸法一致が NG になる）。
  const hasPickerSize = asset.width > 0 && asset.height > 0;
  const base = hasPickerSize ? asset : loaded;
  const cropContext = ImageManipulator.manipulate(asset.uri);
  cropContext.crop({
    originX: 0,
    originY: 0,
    width: Math.floor(base.width / 2),
    height: Math.floor(base.height / 2),
  });
  const cropped = await cropContext.renderAsync();
  const saved = await cropped.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });

  return {
    sourceUri: asset.uri,
    picker: { width: asset.width, height: asset.height },
    exifOrientation: String(asset.exif?.Orientation ?? '—'),
    manipulator: { width: loaded.width, height: loaded.height },
    crop: { uri: saved.uri, width: saved.width, height: saved.height },
  };
}

function formatSize({ width, height }: { width: number; height: number }) {
  return `${width} × ${height}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.row}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="code">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previews: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  preview: {
    width: PREVIEW_EDGE,
    height: PREVIEW_EDGE,
  },
});
