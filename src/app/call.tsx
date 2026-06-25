import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Waveform } from '@/components/Waveform';
import { colors } from '@/theme';
import { formatDuration } from '@/lib/format';
import { supabase } from '@/lib/supabase';

/* eslint-disable @typescript-eslint/no-explicit-any */

function CircleBtn({ icon, onPress, bg = colors.deepBtn, size = 60 }: { icon: keyof typeof Feather.glyphMap; onPress?: () => void; bg?: string; size?: number }) {
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={24} color={colors.onDeep} />
    </Pressable>
  );
}

export default function Call() {
  const router = useRouter();
  const { name = 'Caller', seed = 'caller', peer } = useLocalSearchParams<{ name?: string; seed?: string; peer?: string }>();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(!peer);
  const channelRef = useRef<any>(null);

  // Presence: both people on the same call channel see each other connect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const me = data.user?.id ?? 'me';
      const key = peer ? [me, peer].sort().join(':') : me;
      const channel = supabase.channel(`call:${key}`, { config: { presence: { key: me } } });
      channel.on('presence', { event: 'sync' }, () => {
        if (cancelled) return;
        const count = Object.keys(channel.presenceState()).length;
        setConnected(peer ? count > 1 : true);
      });
      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') await channel.track({ online: true });
      });
      channelRef.current = channel;
    })();
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [peer]);

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
          <Text style={{ fontSize: 14, color: colors.onDeepSoft }}>
            {connected ? `Connected — ${formatDuration(seconds)}` : 'Ringing…'}
          </Text>
        </View>
        {connected ? (
          <View style={{ width: 220, height: 30, marginTop: 8 }}>
            <Waveform bars={26} max={26} barWidth={2.5} gap={3} played={13} color={colors.onDeep} trackColor="rgba(255,255,255,0.25)" />
          </View>
        ) : null}
        <Text style={{ fontSize: 12, color: colors.onDeepSoft, textAlign: 'center', paddingHorizontal: 40, marginTop: 4 }}>
          You&apos;re both connected. Live voice turns on once the media service is added — presence is live now.
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
        <CircleBtn icon={muted ? 'mic-off' : 'mic'} bg={muted ? colors.live : colors.deepBtn} onPress={() => setMuted((m) => !m)} />
        <CircleBtn icon="volume-2" />
        <CircleBtn icon="more-horizontal" />
        <CircleBtn icon="phone-off" bg={colors.live} onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
