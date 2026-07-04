import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/theme';
import { updateCallStatus, subscribeCall } from '@/lib/calls';

function BigBtn({ icon, color, label, onPress }: { icon: keyof typeof Feather.glyphMap; color: string; label: string; onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onPress} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={30} color={colors.white} />
      </Pressable>
      <Text style={{ fontSize: 13, color: colors.onDeepSoft }}>{label}</Text>
    </View>
  );
}

export default function IncomingCall() {
  const router = useRouter();
  const { callId = '', name = 'Someone', seed = 'caller' } = useLocalSearchParams<{ callId?: string; name?: string; seed?: string }>();

  // If the caller hangs up before we answer, dismiss this screen.
  useEffect(() => {
    if (!callId) return;
    const unsub = subscribeCall(callId, (status) => {
      if (status === 'ended' || status === 'declined') router.back();
    });
    return unsub;
  }, [callId, router]);

  const accept = async () => {
    await updateCallStatus(callId, 'accepted');
    router.replace({ pathname: '/call', params: { room: callId, callId, name, seed } });
  };

  const decline = async () => {
    await updateCallStatus(callId, 'declined');
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deep }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onDeepSoft, letterSpacing: 1 }}>INCOMING NAIZZ CALL</Text>
        <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <Avatar seed={seed} name={name} size={150} />
        </View>
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.onDeep }}>{name}</Text>
        <Text style={{ fontSize: 15, color: colors.onDeepSoft }}>is calling…</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 40, paddingBottom: 40 }}>
        <BigBtn icon="phone-off" color={colors.live} label="Decline" onPress={decline} />
        <BigBtn icon="phone" color={colors.green} label="Accept" onPress={accept} />
      </View>
    </SafeAreaView>
  );
}
