import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { EmptyState } from '@/components/EmptyState';
import { RowSkeleton } from '@/components/Skeleton';
import { colors, spacing, type } from '@/theme';
import { timeAgo } from '@/lib/format';
import { listNotifications, markNotificationsRead } from '@/lib/notifications';
import { loadNotifPrefs, NotifPrefs } from '@/lib/settings';
import type { AppNotification } from '@/lib/types';

const PREF_KEY: Record<AppNotification['type'], keyof NotifPrefs> = {
  like: 'likes',
  follow: 'follows',
  reply: 'replies',
};

const ACTION: Record<AppNotification['type'], string> = {
  like: 'liked your voice',
  follow: 'started following you',
  reply: 'replied with a voice',
};
const ICON: Record<AppNotification['type'], keyof typeof Feather.glyphMap> = {
  like: 'heart',
  follow: 'user-plus',
  reply: 'mic',
};
const TINT: Record<AppNotification['type'], string> = {
  like: colors.live,
  follow: colors.primary,
  reply: colors.green,
};

export default function Activity() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [prefs, setPrefs] = useState<NotifPrefs>({ likes: true, follows: true, replies: true });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, p] = await Promise.all([listNotifications(), loadNotifPrefs()]);
      setItems(data);
      setPrefs(p);
      markNotificationsRead().catch(() => {});
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const visible = items.filter((n) => prefs[PREF_KEY[n.type]]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen>
      <View style={{ height: 56, paddingHorizontal: spacing.gutter, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[type.title1, { flex: 1, color: colors.ink }]}>Activity</Text>
        <IconButton name="settings" accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
      </View>

      {loading ? (
        <RowSkeleton />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={visible.length === 0 ? { flexGrow: 1 } : undefined}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingVertical: spacing.md, gap: spacing.md }}>
              <Avatar seed={item.actorUsername} name={item.actorDisplayName} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[type.subhead, { color: colors.ink }]}>
                  <Text style={{ fontWeight: '700' }}>{item.actorDisplayName}</Text> {ACTION[item.type]}
                </Text>
                <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{timeAgo(item.createdAt)}</Text>
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: TINT[item.type] + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={ICON[item.type]} size={16} color={TINT[item.type]} />
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 72 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="No activity yet"
              subtitle="Likes, new followers, and voice replies will land here."
            />
          }
        />
      )}
    </Screen>
  );
}
