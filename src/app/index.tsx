import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { Button } from '@/components/Button';
import { Waveform } from '@/components/Waveform';

function FloatingPill({ time, style }: { time: string; style?: object }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: 999,
          paddingVertical: 6,
          paddingLeft: 6,
          paddingRight: 12,
          gap: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        },
        style,
      ]}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 7, height: 7, borderRadius: 1.5, backgroundColor: colors.white }} />
      </View>
      <View style={{ width: 56 }}>
        <Waveform bars={11} max={12} barWidth={2} gap={2} played={6} color={colors.primary} trackColor={colors.border} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSec }}>{time}</Text>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center' }}>
        <Text style={{ fontSize: 34, fontWeight: '700', color: colors.primary, marginTop: 8 }}>Naizz</Text>

        {/* Mic with concentric rings + floating voice pills */}
        <View style={{ height: 300, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(21,115,166,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 175, height: 175, borderRadius: 88, backgroundColor: 'rgba(21,115,166,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="mic" size={48} color={colors.white} />
              </View>
            </View>
          </View>
          <FloatingPill time="0:07" style={{ top: 40, right: 0 }} />
          <FloatingPill time="0:32" style={{ bottom: 36, left: 0 }} />
        </View>

        <Text style={{ fontSize: 40, fontWeight: '800', color: colors.ink, textAlign: 'center', marginTop: 8 }}>
          Say it out <Text style={{ color: colors.primary }}>loud.</Text>
        </Text>
        <Text style={{ fontSize: 15, color: colors.textSec, textAlign: 'center', lineHeight: 23, marginTop: 16, paddingHorizontal: 8 }}>
          A cozy corner of the internet where every post is your voice. No typing, no pressure — just talk, listen, connect.
        </Text>

        <View style={{ flex: 1 }} />

        <View style={{ width: '100%', gap: 12, paddingBottom: 12 }}>
          <Button label="Get started" icon="mic" variant="dark" fill onPress={() => router.push('/sign-up')} />
          <Button label="I already have an account" variant="secondary" fill onPress={() => router.push('/sign-in')} />
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
