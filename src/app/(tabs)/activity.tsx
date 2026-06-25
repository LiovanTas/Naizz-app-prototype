import { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { colors } from '@/theme';
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
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 26, fontWeight: '800', color: colors.ink }}>Activity</Text>
        <IconButton name="settings" onPress={() => router.push('/settings')} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
              <Avatar seed={item.actorUsername} name={item.actorDisplayName} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, lineHeight: 20, color: colors.ink }}>
                  <Text style={{ fontWeight: '700' }}>{item.actorDisplayName}</Text> {ACTION[item.type]}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{timeAgo(item.createdAt)}</Text>
              </View>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={ICON[item.type]} size={17} color={colors.primary} />
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 72 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', lineHeight: 20 }}>
                No activity yet. Likes, follows and voice replies will show up here.
              </Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
