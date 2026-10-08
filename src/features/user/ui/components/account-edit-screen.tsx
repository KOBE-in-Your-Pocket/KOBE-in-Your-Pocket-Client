import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { pickProfileIcon } from '../../application/pick-profile-icon';
import { useCurrentUser } from '../../application/use-current-user';
import { useUpdateProfile } from '../../application/use-update-profile';
import { isValidDisplayName, MAX_DISPLAY_NAME_LENGTH } from '../../domain/profile-edits';
import { UserAvatar } from './user-avatar';

import type { PublicUser } from '../../domain/public-user';

const SAVE_BUTTON_COLOR = '#D45B45';
const ERROR_TEXT_COLOR = '#D45B45';
const AVATAR_SIZE = 96;

/**
 * アカウント編集画面（#402）。
 * 現在のアカウント情報を初期表示し、表示名とアイコンを編集できる。
 * アイコンはタップで端末の写真ライブラリを開いて選ぶ（#546）。
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
  const [pickErrorKey, setPickErrorKey] = useState<string | null>(null);

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
        setNewIconUri(result.uri);
      } else if (result.status === 'permissionDenied') {
        setPickErrorKey('settings.accountEdit.iconPermissionDenied');
      }
    } catch {
      setPickErrorKey('settings.accountEdit.iconPickError');
    } finally {
      setPicking(false);
    }
  }

  return (
    <>
      <Header canSave={canSave} isSaving={updateProfile.isPending || picking} onSave={handleSave} />

      <View style={styles.iconArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.accountEdit.changeIcon')}
          disabled={picking || updateProfile.isPending}
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
