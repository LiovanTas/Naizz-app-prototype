import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow, radius } from '@/theme';

type Route = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: Route[] };
  navigation: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit: (e: any) => any;
    navigate: (name: string) => void;
  };
};

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  home: 'home',
  'for-you': 'compass',
  activity: 'bell',
  profile: 'user',
};
const LABELS: Record<string, string> = {
  home: 'Home',
  'for-you': 'Discover',
  activity: 'Activity',
  profile: 'You',
};

export function TabBar({ state, navigation }: TabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const mid = Math.ceil(routes.length / 2);

  const renderTab = (route: Route) => {
    const index = routes.indexOf(route);
    const focused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={LABELS[route.name] ?? route.name}
        style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 5,
            borderRadius: radius.pill,
            backgroundColor: focused ? colors.primarySoft : 'transparent',
          }}
        >
          <Feather name={ICONS[route.name]} size={21} color={focused ? colors.primary : colors.textMuted} />
        </View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: focused ? '700' : '500',
            letterSpacing: -0.1,
            color: focused ? colors.primary : colors.textMuted,
          }}
        >
          {LABELS[route.name] ?? route.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 12,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        ...shadow.lg,
      }}
    >
      {routes.slice(0, mid).map(renderTab)}

      {/* Center record button (raised) */}
      <View style={{ width: 72, alignItems: 'center' }}>
        <Pressable
          onPress={() => router.push('/record')}
          accessibilityRole="button"
          accessibilityLabel="Record a voice"
          style={({ pressed }) => ({
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -26,
            borderWidth: 4,
            borderColor: colors.white,
            transform: [{ scale: pressed ? 0.94 : 1 }],
            ...shadow.md,
          })}
        >
          <Feather name="mic" size={25} color={colors.white} />
        </Pressable>
      </View>

      {routes.slice(mid).map(renderTab)}
    </View>
  );
}
