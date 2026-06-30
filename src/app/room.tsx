import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Waveform } from '@/components/Waveform';
import { colors, radius, spacing, type, shadow } from '@/theme';
import { supabase } from '@/lib/supabase';
import { getRoom, listRoomMembers, joinRoom, leaveRoom, setMuted } from '@/lib/rooms';
import type { RoomMember, RoomSummary } from '@/lib/types';

function CircleBtn({ icon, onPress, bg = colors.deepBtn, label }: { icon: keyof typeof Feather.glyphMap; onPress?: () => void; bg?: string; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 26, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.92 : 1 }], ...shadow.sm })}
    >
      <Feather name={icon} size={22} color={colors.onDeep} />
    </Pressable>
  );
}

export default function Room() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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

  useEffect(() => {
    if (!id) return;
    joinRoom(id).then(load).catch(() => {});
    const channel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      leaveRoom(id).catch(() => {});
    };
  }, [id, load]);

  const me = members.find((m) => m.userId === meId);
  const speakers = members.filter((m) => m.role === 'host' || m.role === 'speaker');
  const listeners = members.filter((m) => m.role === 'listener');

  const onLeave = async () => {
    if (id) await leaveRoom(id);
    router.back();
  };

  const toggleMute = async () => {
    if (!id || !me) return;
    await setMuted(id, !me.muted);
    load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deep }}>
      {/* Header */}
      <View style={{ height: 56, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Badge label="LIVE" tone="live" dot />
        </View>
        <Pressable onPress={onLeave} hitSlop={8} accessibilityLabel="Minimize room" style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.deepBtn, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Feather name="chevron-down" size={22} color={colors.onDeep} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={[type.title1, { color: colors.onDeep, marginTop: spacing.xs }]}>
          {room?.title ?? 'Live room'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.sm }}>
          <Feather name="users" size={15} color={colors.onDeepSoft} />
          <Text style={[type.footnote, { color: colors.onDeepSoft }]}>
            Hosted by @{room?.hostUsername ?? '...'} · {members.length} in room
          </Text>
        </View>

        {/* Speakers */}
        <Text style={[type.label, { letterSpacing: 2, color: colors.onDeepSoft, marginTop: spacing.xxl }]}>SPEAKERS</Text>
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

        {/* Captions */}
        <View style={{ backgroundColor: colors.deepCard, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.deepLine }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[type.label, { letterSpacing: 1.2, color: colors.green }]}>LIVE CAPTIONS</Text>
            <View style={{ width: 60, height: 18 }}>
              <Waveform bars={14} max={16} barWidth={2} gap={2} played={7} color={colors.green} trackColor="rgba(31,169,125,0.3)" />
            </View>
          </View>
          <Text style={[type.subhead, { color: colors.onDeep, lineHeight: 21, marginTop: spacing.md }]}>
            You&apos;re in the room. Live audio is in presence mode for this build — captions and voice stream turn on when the media service is connected.
          </Text>
        </View>

        {/* Listeners */}
        <Text style={[type.label, { letterSpacing: 2, color: colors.onDeepSoft, marginTop: spacing.xxl }]}>
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
        <CircleBtn icon={me?.muted ? 'mic-off' : 'mic'} label={me?.muted ? 'Unmute' : 'Mute'} onPress={toggleMute} bg={me?.muted ? colors.deepBtn : colors.primary} />
        <CircleBtn icon="user-plus" label="Invite" onPress={() => router.push({ pathname: '/connections', params: { mode: 'invite', roomId: id } })} />
        <CircleBtn icon="share" label="Share room" />
        <View style={{ flex: 1 }} />
        <Button label="Leave" variant="danger" height={52} radiusOverride={26} onPress={onLeave} style={{ paddingHorizontal: 32 }} />
      </View>
    </SafeAreaView>
  );
}
