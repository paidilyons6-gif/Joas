import { Tabs } from 'expo-router';
import { colours, minTouch } from '../../src/theme';

/**
 * Only the tabs Milestone 1 actually ships. Today, Outfits and Drops arrive with
 * M3 and M4 — a tab that opens an empty "coming soon" screen is worse than no
 * tab, and App Store review reads it as an unfinished app.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colours.accent,
        tabBarInactiveTintColor: colours.textMuted,
        tabBarStyle: { backgroundColor: colours.surface, borderTopColor: colours.border },
        tabBarItemStyle: { minHeight: minTouch },
        headerStyle: { backgroundColor: colours.background },
        headerTitleStyle: { color: colours.text },
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{ title: 'Wardrobe', tabBarLabel: 'Wardrobe' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarLabel: 'Settings' }}
      />
    </Tabs>
  );
}
