import { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useRoomSession } from '@/lib/roomSession';
import { subscribeIncomingCalls } from '@/lib/calls';

// Floating bar shown when a voice room is minimized (you're still connected).
export function MiniRoomBar() {
  const { active, muted, exit, toggleMute } = useRoomSession();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  if (!active) return null;
  const seg0 = segments[0] as string | undefined;
  if (seg0 === 'room' || seg0 === 'call' || seg0 === 'incoming-call') return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: (insets.bottom > 0 ? insets.bottom : 10) + 72,
        backgroundColor: colors.deep,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.live }} />
      <Pressable style={{ flex: 1 }} onPress={() => router.push({ pathname: '/room', params: { id: active.roomId } })}>
        <Text numberOfLines={1} style={{ color: colors.onDeep, fontWeight: '700', fontSize: 14 }}>{active.title}</Text>
        <Text style={{ color: colors.onDeepSoft, fontSize: 12 }}>Tap to return · you&apos;re live</Text>
      </Pressable>
      <Pressable onPress={toggleMute} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.deepBtn, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={muted ? 'mic-off' : 'mic'} size={17} color={colors.onDeep} />
      </Pressable>
      <Pressable onPress={exit} hitSlop={8}>
        <Text style={{ color: colors.live, fontWeight: '700', fontSize: 14 }}>Leave</Text>
      </Pressable>
    </View>
  );
}

// Global listener: navigates to the incoming-call screen when someone rings you.
export function IncomingCallGate() {
  const { session } = useAuth();
  const router = useRouter();
  const handling = useRef<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let unsub: (() => void) | undefined;
    subscribeIncomingCalls((c) => {
      if (handling.current === c.callId) return;
      handling.current = c.callId;
      router.push({ pathname: '/incoming-call', params: { callId: c.callId, name: c.callerName, seed: c.callerUsername } });
      setTimeout(() => {
        handling.current = null;
      }, 45000);
    }).then((u) => {
      unsub = u;
    });
    return () => unsub?.();
  }, [session, router]);

  return null;
}
