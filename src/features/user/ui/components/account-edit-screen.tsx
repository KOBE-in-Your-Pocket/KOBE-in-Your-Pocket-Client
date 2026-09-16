import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { useCurrentUser } from '../../application/use-current-user';
import { useUpdateProfile } from '../../application/use-update-profile';
import { isValidDisplayName, MAX_DISPLAY_NAME_LENGTH } from '../../domain/profile-edits';
import { IconLibraryModal } from './icon-library-modal';
import { UserAvatar } from './user-avatar';

import type { PublicUser } from '../../domain/public-user';

const SAVE_BUTTON_COLOR = '#D45B45';
const AVATAR_SIZE = 96;

/**
 * アカウント編集画面（#402）。
 * 現在のアカウント情報を初期表示し、表示名とアイコンを編集できる。
 * アイコンはタップでモック写真ライブラリ（{@link IconLibraryModal}）を開いて選ぶ。
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
  const [iconUrl, setIconUrl] = useState(currentUser.iconUrl);
  const [libraryVisible, setLibraryVisible] = useState(false);

  const canSave = isValidDisplayName(name);

  function handleSave() {
    updateProfile.mutate({ name, iconUrl }, { onSuccess: () => router.back() });
  }

  return (
    <>
      <Header canSave={canSave} isSaving={updateProfile.isPending} onSave={handleSave} />

      <View style={styles.iconArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.accountEdit.changeIcon')}
          onPress={() => setLibraryVisible(true)}
          style={styles.avatarButton}
        >
          <UserAvatar iconUrl={iconUrl} size={AVATAR_SIZE} />
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
          onChangeText={setName}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
        />
        {canSave ? null : (
          <ThemedText type="small" themeColor="textSecondary">
            {t('settings.accountEdit.nameInvalid', { max: MAX_DISPLAY_NAME_LENGTH })}
          </ThemedText>
        )}
      </View>

      <IconLibraryModal
        visible={libraryVisible}
        selectedIconUrl={iconUrl}
        onSelect={(url) => {
          setIconUrl(url);
          setLibraryVisible(false);
        }}
        onClose={() => setLibraryVisible(false)}
      />
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
