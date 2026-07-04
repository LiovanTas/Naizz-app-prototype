import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Waveform } from '@/components/Waveform';
import { colors } from '@/theme';
import { formatDuration } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { connectToRoom, disconnectRoom, RoomEvent, Room } from '@/lib/livekit';
import { subscribeCall, updateCallStatus } from '@/lib/calls';

function CircleBtn({ icon, onPress, bg = colors.deepBtn, size = 60 }: { icon: keyof typeof Feather.glyphMap; onPress?: () => void; bg?: string; size?: number }) {
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={24} color={colors.onDeep} />
    </Pressable>
  );
}

export default function Call() {
  const router = useRouter();
  const { name = 'Caller', seed = 'caller', peer, room, callId, outgoing } = useLocalSearchParams<{
    name?: string;
    seed?: string;
    peer?: string;
    room?: string;
    callId?: string;
    outgoing?: string;
  }>();
  const isOutgoing = outgoing === '1';
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const lkRoom = useRef<Room | null>(null);

  // Join the LiveKit room (real audio). Room name = callId when calling, else the user pair.
  useEffect(() => {
    let active = true;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    (async () => {
      const { data } = await supabase.auth.getUser();
      const meId = data.user?.id ?? 'me';
      const key = room ?? (peer ? [meId, peer].sort().join(':') : `solo-${meId}`);
      try {
        const r = await connectToRoom(key, true);
        if (!active) {
          disconnectRoom(r);
          return;
        }
        lkRoom.current = r;
        const update = () => setConnected(r.remoteParticipants.size > 0);
        r.on(RoomEvent.ParticipantConnected, update);
        r.on(RoomEvent.ParticipantDisconnected, update);
        update();
      } catch {
        /* no media — stays ringing */
      }
    })();
    return () => {
      active = false;
      clearInterval(timer);
      disconnectRoom(lkRoom.current);
      lkRoom.current = null;
    };
  }, [peer, room]);

  // Watch call signaling: caller sees decline; either side sees the other hang up.
  useEffect(() => {
    if (!callId) return;
    const unsub = subscribeCall(callId, (status) => {
      if (status === 'declined') {
        Alert.alert('Call declined', `${name} declined the call.`);
        router.back();
      } else if (status === 'ended') {
        router.back();
      }
    });
    return unsub;
  }, [callId, name, router]);

  const hangUp = async () => {
    if (callId) await updateCallStatus(callId, 'ended').catch(() => {});
    router.back();
  };

  const toggleMute = async () => {
    const next = !muted;
    setMuted(next);
    try {
      await lkRoom.current?.localParticipant?.setMicrophoneEnabled(!next);
    } catch {
      /* ignore */
    }
  };

  const statusText = connected
    ? `Connected — ${formatDuration(seconds)}`
    : isOutgoing
      ? 'Calling…'
      : 'Connecting…';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deep }}>
      <View style={{ alignItems: 'center', paddingTop: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.onDeep }}>Private call</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Feather name="lock" size={13} color={colors.onDeepSoft} />
          <Text style={{ fontSize: 13, color: colors.onDeepSoft }}>End-to-end encrypted</Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <View style={{ width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
          <Avatar seed={seed} name={name} size={170} />
        </View>
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.onDeep }}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connected ? colors.green : colors.warm }} />
          <Text style={{ fontSize: 14, color: colors.onDeepSoft }}>{statusText}</Text>
        </View>
        {connected ? (
          <View style={{ width: 220, height: 30, marginTop: 8 }}>
            <Waveform bars={26} max={26} barWidth={2.5} gap={3} played={13} color={colors.onDeep} trackColor="rgba(255,255,255,0.25)" />
          </View>
        ) : null}
        <Text style={{ fontSize: 12, color: connected ? colors.green : colors.onDeepSoft, textAlign: 'center', paddingHorizontal: 40, marginTop: 4 }}>
          {connected ? '🎙️  Live audio is on — say something!' : isOutgoing ? 'Ringing the other person…' : 'Connecting to audio…'}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.deepCard, borderRadius: 999, paddingLeft: 6, paddingRight: 14, paddingVertical: 6 }}>
          <Avatar seed="you" name="You" size={28} />
          <Text style={{ fontSize: 13, color: colors.onDeep }}>Your mic is {muted ? 'off' : 'on'}</Text>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: muted ? colors.live : colors.green }} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20, paddingBottom: 10 }}>
        <CircleBtn icon={muted ? 'mic-off' : 'mic'} bg={muted ? colors.live : colors.deepBtn} onPress={toggleMute} />
        <CircleBtn icon="volume-2" />
        <CircleBtn icon="more-horizontal" />
        <CircleBtn icon="phone-off" bg={colors.live} onPress={hangUp} />
      </View>
    </SafeAreaView>
  );
}
