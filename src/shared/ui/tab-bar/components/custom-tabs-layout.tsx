import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomTabList } from './custom-tab-list';
import { TabButton } from './tab-button';

import { styles } from '../styles/custom-tabs-layout.styles';
import { TAB_BAR_CONTENT_HEIGHT, HIDDEN_TAB_DEFS, TAB_DEFS } from '../tab-bar-config';

import { Spacing } from '@/shared/config';

export function CustomTabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarInset = TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, Spacing.two);

  return (
    <Tabs>
      <View style={[styles.content, { paddingBottom: tabBarInset }]}>
        <TabSlot style={styles.tabSlot} />
      </View>
      <TabList style={{ display: 'none' }}>
        {HIDDEN_TAB_DEFS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} />
        ))}
      </TabList>
      <TabList asChild>
        <CustomTabList>
          {TAB_DEFS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton symbol={tab.symbol}>{t(tab.labelKey)}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}
