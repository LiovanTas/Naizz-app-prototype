import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '@/theme';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { SectionLabel } from '@/components/SectionLabel';
import { useAuth } from '@/lib/auth';
import { loadNotifPrefs, saveNotifPrefs, NotifPrefs } from '@/lib/settings';

function ToggleRow({
  icon,
  label,
  desc,
  value,
  onChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.callout, { fontWeight: '700', color: colors.ink }]}>{label}</Text>
        <Text style={[type.footnote, { color: colors.textMuted, marginTop: 1 }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>({ likes: true, follows: true, replies: true });

  useEffect(() => {
    loadNotifPrefs().then(setPrefs);
  }, []);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveNotifPrefs(next).catch(() => {});
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Sign out of Naizz?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <AppHeader title="Settings" variant="inline" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: spacing.gutter, gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <SectionLabel>Notifications</SectionLabel>
          <Card padding={spacing.lg} style={{ paddingVertical: 4 }}>
            <ToggleRow icon="heart" label="Likes" desc="When someone likes your voice" value={prefs.likes} onChange={(v) => update({ likes: v })} />
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <ToggleRow icon="user-plus" label="New followers" desc="When someone follows you" value={prefs.follows} onChange={(v) => update({ follows: v })} />
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <ToggleRow icon="mic" label="Voice replies" desc="When someone replies to your post" value={prefs.replies} onChange={(v) => update({ replies: v })} />
          </Card>
        </View>

        <View style={{ gap: spacing.sm }}>
          <SectionLabel>Account</SectionLabel>
          <Card padding={0}>
            <Pressable onPress={() => router.push('/edit-profile')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: pressed ? colors.cardAlt : 'transparent', borderTopLeftRadius: 20, borderTopRightRadius: 20 })}>
              <Feather name="edit-2" size={18} color={colors.ink} />
              <Text style={[type.callout, { flex: 1, fontWeight: '600', color: colors.ink }]}>Edit profile</Text>
              <Feather name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
            <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg }} />
            <Pressable onPress={onSignOut} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: pressed ? colors.cardAlt : 'transparent', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 })}>
              <Feather name="log-out" size={18} color={colors.live} />
              <Text style={[type.callout, { flex: 1, fontWeight: '600', color: colors.live }]}>Sign out</Text>
            </Pressable>
          </Card>
        </View>

        <Text style={[type.caption, { textAlign: 'center', color: colors.textMuted, marginTop: spacing.sm }]}>
          Signed in as @{profile?.username ?? '—'} · Naizz alpha
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
