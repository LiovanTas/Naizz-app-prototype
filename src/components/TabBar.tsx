import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

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
  'for-you': 'search',
  activity: 'bell',
  profile: 'user',
};
const LABELS: Record<string, string> = {
  home: 'HOME',
  'for-you': 'FOR YOU',
  activity: 'ACTIVITY',
  profile: 'YOU',
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
      <Pressable key={route.key} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 }}>
        {focused ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary }} /> : <View style={{ height: 5 }} />}
        <Text
          style={{
            fontSize: 11,
            fontWeight: focused ? '700' : '500',
            letterSpacing: 0.5,
            color: focused ? colors.ink : colors.textMuted,
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
        backgroundColor: colors.bg,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 14,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
      }}
    >
      {routes.slice(0, mid).map(renderTab)}

      {/* Center record button (raised) */}
      <View style={{ width: 72, alignItems: 'center' }}>
        <Pressable
          onPress={() => router.push('/record')}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -28,
            borderWidth: 5,
            borderColor: colors.bg,
          }}
        >
          <Feather name="mic" size={26} color={colors.white} />
        </Pressable>
      </View>

      {routes.slice(mid).map(renderTab)}
    </View>
  );
}
