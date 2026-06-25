import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme';
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
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{label}</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 1 }}>{desc}</Text>
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
      <View style={{ height: 56, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 6 }}>
          <Feather name="chevron-left" size={26} color={colors.ink} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.textMuted, marginTop: 12 }}>NOTIFICATIONS</Text>
          <ToggleRow icon="heart" label="Likes" desc="When someone likes your voice" value={prefs.likes} onChange={(v) => update({ likes: v })} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <ToggleRow icon="user-plus" label="New followers" desc="When someone follows you" value={prefs.follows} onChange={(v) => update({ follows: v })} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <ToggleRow icon="mic" label="Voice replies" desc="When someone replies to your post" value={prefs.replies} onChange={(v) => update({ replies: v })} />
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: radius.xl }}>
          <Pressable onPress={() => router.push('/edit-profile')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
            <Feather name="edit-2" size={18} color={colors.ink} />
            <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.ink }}>Edit profile</Text>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
          <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 16 }} />
          <Pressable onPress={onSignOut} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
            <Feather name="log-out" size={18} color={colors.live} />
            <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '600', color: colors.live }}>Sign out</Text>
          </Pressable>
        </View>

        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
          Signed in as @{profile?.username ?? '—'} · Naizz alpha
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
