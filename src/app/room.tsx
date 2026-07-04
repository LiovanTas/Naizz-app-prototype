import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Waveform } from '@/components/Waveform';
import { colors } from '@/theme';
import { supabase } from '@/lib/supabase';
import { getRoom, listRoomMembers } from '@/lib/rooms';
import { useRoomSession } from '@/lib/roomSession';
import type { RoomMember, RoomSummary } from '@/lib/types';

function CircleBtn({ icon, onPress, bg = colors.deepBtn }: { icon: keyof typeof Feather.glyphMap; onPress?: () => void; bg?: string }) {
  return (
    <Pressable onPress={onPress} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={22} color={colors.onDeep} />
    </Pressable>
  );
}

export default function Room() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { active, muted, enter, exit, toggleMute } = useRoomSession();
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [meId, setMeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const [r, m] = await Promise.all([getRoom(id), listRoomMembers(id)]);
    setRoom(r);
    setMembers(m);
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  // Join via the session provider (keeps audio alive if you minimize).
  useEffect(() => {
    if (!id) return;
    enter(id).then(load).catch(() => {});
    const channel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${id}` }, () => load())
      .subscribe();
    // NOTE: no leaveRoom here — navigating away minimizes; only "Leave" exits.
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const liveConnected = active?.roomId === id;
  const speakers = members.filter((m) => m.role === 'host' || m.role === 'speaker');
  const listeners = members.filter((m) => m.role === 'listener');

  const onLeave = async () => {
    await exit();
    router.back();
  };

  const onMic = async () => {
    await toggleMute();
    load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deep }}>
      {/* Header */}
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.live, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.white }} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.white, letterSpacing: 1 }}>LIVE</Text>
          </View>
        </View>
        {/* Chevron = minimize (stay in the room) */}
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.deepBtn, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="chevron-down" size={22} color={colors.onDeep} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.onDeep, lineHeight: 30, marginTop: 4 }}>
          {room?.title ?? 'Live room'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }}>
          <Feather name="users" size={15} color={colors.onDeepSoft} />
          <Text style={{ fontSize: 13.5, color: colors.onDeepSoft }}>
            Hosted by @{room?.hostUsername ?? '...'} · {members.length} in room
          </Text>
        </View>

        {/* Speakers */}
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.onDeepSoft, marginTop: 24 }}>SPEAKERS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 }}>
          {speakers.map((m) => (
            <View key={m.userId} style={{ width: '25%', alignItems: 'center', marginBottom: 18 }}>
              <View>
                <Avatar seed={m.username} name={m.displayName} size={68} ring={m.muted ? undefined : colors.green} />
                <View style={{ position: 'absolute', bottom: 0, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.deepCard, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={m.muted ? 'mic-off' : 'mic'} size={12} color={m.muted ? colors.onDeepSoft : colors.green} />
                </View>
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: '700', color: colors.onDeep, marginTop: 6, maxWidth: 76 }}>
                {m.displayName.split(' ')[0]}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: colors.onDeepSoft }}>{m.role.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Status */}
        <View style={{ backgroundColor: colors.deepCard, borderRadius: 18, padding: 18, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: colors.green }}>LIVE AUDIO</Text>
            <View style={{ width: 60, height: 18 }}>
              <Waveform bars={14} max={16} barWidth={2} gap={2} played={7} color={colors.green} trackColor="rgba(47,191,143,0.3)" />
            </View>
          </View>
          <Text style={{ fontSize: 14.5, color: colors.onDeep, lineHeight: 21, marginTop: 12 }}>
            {liveConnected
              ? 'Live audio is on — tap the mic to talk; everyone in the room can hear you. Tap the ⌄ to minimize and keep listening.'
              : 'Connecting to live audio…'}
          </Text>
        </View>

        {/* Listeners */}
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, color: colors.onDeepSoft, marginTop: 24 }}>
          LISTENERS — {listeners.length}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {listeners.map((m) => (
            <Avatar key={m.userId} seed={m.username} name={m.displayName} size={42} />
          ))}
          {listeners.length === 0 ? <Text style={{ fontSize: 13.5, color: colors.onDeepSoft }}>No listeners yet.</Text> : null}
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <CircleBtn icon={muted ? 'mic-off' : 'mic'} onPress={onMic} bg={muted ? colors.deepBtn : colors.primary} />
        <CircleBtn icon="user-plus" onPress={() => router.push({ pathname: '/connections', params: { mode: 'invite', roomId: id } })} />
        <CircleBtn icon="share" />
        <View style={{ flex: 1 }} />
        <Button label="Leave" variant="danger" height={52} radiusOverride={26} onPress={onLeave} style={{ paddingHorizontal: 32 }} />
      </View>
    </SafeAreaView>
  );
}
