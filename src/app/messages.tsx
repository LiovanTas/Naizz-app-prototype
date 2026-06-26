import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { RowSkeleton } from '@/components/Skeleton';
import { colors, radius, spacing, type, shadow } from '@/theme';
import { timeAgo, formatDuration } from '@/lib/format';
import { listConversations } from '@/lib/messages';
import type { ConversationSummary } from '@/lib/types';

export default function Messages() {
  const router = useRouter();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await listConversations());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

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

  const filtered = items.filter((c) => c.otherDisplayName.toLowerCase().includes(query.toLowerCase()));

  const preview = (c: ConversationSummary) => {
    if (c.lastKind === 'voice') return `${c.lastSenderIsMe ? 'You: ' : ''}Voice · ${formatDuration(c.lastDuration)}`;
    if (!c.lastMessage) return 'Say hi with your voice';
    return `${c.lastSenderIsMe ? 'You: ' : ''}${c.lastMessage}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AppHeader
        title="Messages"
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => router.push('/new-message')}
            accessibilityRole="button"
            accessibilityLabel="New message"
            style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }], ...shadow.sm })}
          >
            <Feather name="edit" size={19} color={colors.white} />
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: spacing.gutter, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14 }}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: colors.ink }}
          />
        </View>
      </View>

      {loading ? (
        <RowSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/conversation', params: { id: item.id, name: item.otherDisplayName, seed: item.otherUsername, otherId: item.otherUserId } })}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
            >
              <Avatar seed={item.otherUsername} name={item.otherDisplayName} size={52} ring={item.unread > 0 ? colors.primary : undefined} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[type.callout, { flex: 1, fontWeight: item.unread > 0 ? '800' : '700', color: colors.ink }]}>
                    {item.otherDisplayName}
                  </Text>
                  <Text style={[type.caption, { color: item.unread > 0 ? colors.primary : colors.textMuted }]}>{timeAgo(item.lastAt)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  {item.lastKind === 'voice' ? <Feather name="mic" size={13} color={item.unread > 0 ? colors.primary : colors.textMuted} style={{ marginRight: 5 }} /> : null}
                  <Text numberOfLines={1} style={[type.footnote, { flex: 1, color: item.unread > 0 ? colors.ink : colors.textMuted, fontWeight: item.unread > 0 ? '600' : '400' }]}>
                    {preview(item)}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.white }}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 80 }} />}
          contentContainerStyle={filtered.length === 0 ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            <EmptyState
              icon="message-circle"
              title="No conversations yet"
              subtitle="Start a voice chat with someone you follow."
              actionLabel="New message"
              onAction={() => router.push('/new-message')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
