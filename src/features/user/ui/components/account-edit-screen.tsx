import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { cropProfileIcon } from '../../application/crop-profile-icon';
import {
  discardPickedProfileIcon,
  pickProfileIcon,
  type PickedProfileIconImage,
} from '../../application/pick-profile-icon';
import { useCurrentUser } from '../../application/use-current-user';
import { useUpdateProfile } from '../../application/use-update-profile';
import { isValidDisplayName, MAX_DISPLAY_NAME_LENGTH } from '../../domain/profile-edits';
import { IconCropScreen } from './icon-crop-screen';
import { UserAvatar } from './user-avatar';

import type { IconCropRect } from '../../domain/icon-crop';
import type { PublicUser } from '../../domain/public-user';

const SAVE_BUTTON_COLOR = '#D45B45';
const ERROR_TEXT_COLOR = '#D45B45';
const AVATAR_SIZE = 96;

/**
 * アカウント編集画面（#402）。
 * 現在のアカウント情報を初期表示し、表示名とアイコンを編集できる。
 * アイコンはタップで端末の写真ライブラリを開いて選び（#546）、調整画面で
 * 位置と大きさを決めてから切り抜く（#720）。
 */
export function AccountEditScreen() {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {currentUser ? (
          // 別ユーザーへの切替時は key で state を破棄し、前ユーザーの編集内容を持ち越さない。
          <AccountEditForm key={currentUser.id} currentUser={currentUser} />
        ) : (
          <>
            <Header />
            <ThemedText type="default" themeColor="textSecondary">
              {t('settings.accountEdit.notSignedIn')}
            </ThemedText>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

/** 画面ヘッダー。onSave 未指定時（未ログイン時）は保存ボタンを表示しない。 */
function Header({
  canSave = false,
  isSaving = false,
  onSave,
}: {
  canSave?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const saveEnabled = canSave && !isSaving;

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings.accountEdit.back')}
        onPress={() => router.back()}
        hitSlop={Spacing.two}
      >
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          tintColor={theme.text}
          size={20}
        />
      </Pressable>
      <ThemedText type="subtitle">{t('settings.accountEdit.title')}</ThemedText>
      {onSave ? (
        <Pressable
          accessibilityRole="button"
          disabled={!saveEnabled}
          onPress={onSave}
          style={[
            styles.saveButton,
            { backgroundColor: saveEnabled ? SAVE_BUTTON_COLOR : theme.backgroundSelected },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{ color: saveEnabled ? '#FFFFFF' : theme.textSecondary }}
          >
            {t('settings.accountEdit.save')}
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.saveButton} />
      )}
    </View>
  );
}

function AccountEditForm({ currentUser }: { currentUser: PublicUser }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(currentUser.name);
  const [newIconUri, setNewIconUri] = useState<string | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const [adjustingImage, setAdjustingImage] = useState<PickedProfileIconImage | null>(null);
  const [cropping, setCropping] = useState(false);
  const [pickErrorKey, setPickErrorKey] = useState<string | null>(null);

  // 写真の選択・調整・切り抜きのどれかをしている間は、保存とアイコンの選び直しを止める。
  const busy = picking || adjustingImage !== null || cropping;

  const canSave = isValidDisplayName(name);
  const previewIconUrl = newIconUri ?? currentUser.iconUrl;

  function handleSave() {
    updateProfile.mutate(
      { name, iconUrl: currentUser.iconUrl, newIconUri },
      { onSuccess: () => router.back() },
    );
  }

  async function handleChangeIcon() {
    setPicking(true);
    setPickErrorKey(null);
    try {
      const result = await pickProfileIcon();
      if (result.status === 'picked') {
        setAdjustingImage(result.image);
      }
    } catch {
      // 以前に選んだ画像が残っていると、エラー表示のまま保存したときに
      // 無関係な古い画像がアップロードされてしまう。
      setNewIconUri(undefined);
      setPickErrorKey('settings.accountEdit.iconPickError');
    } finally {
      setPicking(false);
    }
  }

  async function handleCropConfirm(image: PickedProfileIconImage, crop: IconCropRect | null) {
    setAdjustingImage(null);
    setCropping(true);
    try {
      setNewIconUri(await cropProfileIcon(image, crop));
    } catch {
      // 切り抜きに失敗すると元画像が残るので消す。古い画像を使わないよう選択も取り消す。
      discardPickedProfileIcon(image);
      setNewIconUri(undefined);
      setPickErrorKey('settings.accountEdit.iconPickError');
    } finally {
      setCropping(false);
    }
  }

  function handleCropCancel(image: PickedProfileIconImage) {
    discardPickedProfileIcon(image);
    setAdjustingImage(null);
  }

  return (
    <>
      <Header canSave={canSave} isSaving={updateProfile.isPending || busy} onSave={handleSave} />

      {/* Expo Router のルート間ではコールバックを渡せないため、この画面の中で開く。
          ページシートだと下へのスワイプで閉じる操作が画像のドラッグとぶつかるので全画面にする。 */}
      <Modal
        visible={adjustingImage !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // Android の戻るボタンはキャンセルと同じ扱いにする。
          if (adjustingImage) {
            handleCropCancel(adjustingImage);
          }
        }}
      >
        {adjustingImage ? (
          <IconCropScreen
            image={adjustingImage}
            onConfirm={(crop) => handleCropConfirm(adjustingImage, crop)}
            onCancel={() => handleCropCancel(adjustingImage)}
          />
        ) : null}
      </Modal>

      <View style={styles.iconArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.accountEdit.changeIcon')}
          disabled={busy || updateProfile.isPending}
          onPress={handleChangeIcon}
          style={styles.avatarButton}
        >
          <UserAvatar iconUrl={previewIconUrl} size={AVATAR_SIZE} />
          <View style={[styles.editBadge, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView
              name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
              tintColor={theme.text}
              size={14}
            />
          </View>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.accountEdit.changeIcon')}
        </ThemedText>
        {pickErrorKey ? (
          <ThemedText type="small" accessibilityRole="alert" style={{ color: ERROR_TEXT_COLOR }}>
            {t(pickErrorKey)}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('settings.accountEdit.displayName')}
        </ThemedText>
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: theme.backgroundElement, color: theme.text },
          ]}
          placeholder={t('settings.accountEdit.displayNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (updateProfile.isError) {
              updateProfile.reset();
            }
          }}
          editable={!updateProfile.isPending}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
        />
        {canSave ? null : (
          <ThemedText type="small" themeColor="textSecondary">
            {t('settings.accountEdit.nameInvalid', { max: MAX_DISPLAY_NAME_LENGTH })}
          </ThemedText>
        )}
        {updateProfile.isPending ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('settings.accountEdit.saving')}
          </ThemedText>
        ) : null}
        {updateProfile.isError ? (
          <ThemedText type="small" accessibilityRole="alert" style={{ color: ERROR_TEXT_COLOR }}>
            {t('settings.accountEdit.saveError')}
          </ThemedText>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  iconArea: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: Spacing.two,
  },
  textInput: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
