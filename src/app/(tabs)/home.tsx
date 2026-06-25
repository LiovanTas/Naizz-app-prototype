import { useCallback, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { VoiceCard } from '@/components/VoiceCard';
import { colors, radius } from '@/theme';
import { fetchFeed } from '@/lib/api';
import { listLiveRooms } from '@/lib/rooms';
import type { FeedPost, RoomSummary } from '@/lib/types';

function RoomsRow({ rooms, onGoLive, onOpen }: { rooms: RoomSummary[]; onGoLive: () => void; onOpen: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingHorizontal: 16, paddingVertical: 4 }}>
      <Pressable onPress={onGoLive} style={{ width: 66, alignItems: 'center', gap: 6 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 1.5,
            borderColor: colors.textMuted,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="plus" size={26} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 11.5, color: colors.textSec }}>Yours</Text>
      </Pressable>
      {rooms.map((r) => (
        <Pressable key={r.id} onPress={() => onOpen(r.id)} style={{ width: 66, alignItems: 'center', gap: 6 }}>
          <View>
            <Avatar seed={r.hostUsername} name={r.hostDisplayName} size={64} ring={colors.primary} />
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                alignSelf: 'center',
                backgroundColor: colors.live,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: '800', color: colors.white, letterSpacing: 0.5 }}>LIVE</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.ink, maxWidth: 66 }}>
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
    <View style={{ gap: 16, paddingBottom: 4 }}>
      <RoomsRow rooms={rooms} onGoLive={() => router.push('/create-room')} onOpen={(id) => router.push({ pathname: '/room', params: { id } })} />
      <View style={{ marginHorizontal: 16, backgroundColor: colors.cream, borderRadius: radius.xl, padding: 18, gap: 14 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>Got something to say?</Text>
          <Text style={{ fontSize: 14, color: colors.textSec, lineHeight: 20 }}>
            Start a room — even two friends counts. No stage fright here.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Start a room" icon="mic" onPress={() => router.push('/create-room')} style={{ flex: 1 }} fill />
          <Button label="Just a voice note" variant="secondary" onPress={() => router.push('/record')} style={{ flex: 1 }} fill />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 26, fontWeight: '800', color: colors.primary }}>Naizz</Text>
        <IconButton name="search" />
        <IconButton name="message-circle" onPress={() => router.push('/messages')} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <VoiceCard post={item} showReplies onChanged={load} />
          </View>
        )}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', lineHeight: 20 }}>
              No voices yet — tap the mic to post the first one.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
