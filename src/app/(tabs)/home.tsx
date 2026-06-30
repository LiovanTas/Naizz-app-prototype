import { useCallback, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { VoiceCard } from '@/components/VoiceCard';
import { EmptyState } from '@/components/EmptyState';
import { FeedSkeleton } from '@/components/Skeleton';
import { Badge } from '@/components/Badge';
import { colors, radius, spacing, type, shadow } from '@/theme';
import { fetchFeed } from '@/lib/api';
import { listLiveRooms } from '@/lib/rooms';
import type { FeedPost, RoomSummary } from '@/lib/types';

function RoomsRow({ rooms, onGoLive, onOpen }: { rooms: RoomSummary[]; onGoLive: () => void; onOpen: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingHorizontal: spacing.gutter, paddingVertical: spacing.xs }}>
      <Pressable onPress={onGoLive} style={{ width: 66, alignItems: 'center', gap: 7 }}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            borderWidth: 1.5,
            borderColor: colors.primary,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primarySoft,
          }}
        >
          <Feather name="plus" size={24} color={colors.primary} />
        </View>
        <Text style={[type.caption, { color: colors.textSec }]}>Go live</Text>
      </Pressable>
      {rooms.map((r) => (
        <Pressable key={r.id} onPress={() => onOpen(r.id)} style={{ width: 66, alignItems: 'center', gap: 7 }}>
          <View>
            <Avatar seed={r.hostUsername} name={r.hostDisplayName} size={62} ring={colors.live} />
            <View style={{ position: 'absolute', bottom: -3, alignSelf: 'center' }}>
              <Badge label="LIVE" tone="live" dot />
            </View>
          </View>
          <Text numberOfLines={1} style={[type.caption, { color: colors.ink, maxWidth: 66 }]}>
            {r.hostDisplayName.split(' ')[0]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([fetchFeed('latest'), listLiveRooms()]);
      setPosts(p);
      setRooms(r);
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

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
      {rooms.length > 0 ? <RoomsRow rooms={rooms} onGoLive={() => router.push('/create-room')} onOpen={(id) => router.push({ pathname: '/room', params: { id } })} /> : null}
      <View style={{ marginHorizontal: spacing.gutter, backgroundColor: colors.cream, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md, ...shadow.xs }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.title3, { color: colors.ink }]}>Got something to say?</Text>
          <Text style={[type.subhead, { color: colors.textSec }]}>
            Start a room — even two friends counts. No stage fright here.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label="Start a room" icon="radio" onPress={() => router.push('/create-room')} style={{ flex: 1 }} fill height={46} />
          <Button label="Voice note" variant="secondary" icon="mic" onPress={() => router.push('/record')} style={{ flex: 1 }} fill height={46} />
        </View>
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={{ height: 56, paddingHorizontal: spacing.gutter, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 26, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 }}>Naizz</Text>
        <IconButton name="search" accessibilityLabel="Search" />
        <IconButton name="message-circle" accessibilityLabel="Messages" onPress={() => router.push('/messages')} />
      </View>
      {loading ? (
        <FeedSkeleton />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.gutter }}>
              <VoiceCard post={item} showReplies onChanged={load} />
            </View>
          )}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="mic"
              title="No voices yet"
              subtitle="Be the first to speak up. Tap the mic and post a voice — it only takes a few seconds."
              actionLabel="Record a voice"
              onAction={() => router.push('/record')}
            />
          }
        />
      )}
    </Screen>
  );
}
