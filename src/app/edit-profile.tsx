import { useState } from 'react';
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, type, spacing } from '@/theme';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/lib/auth';
import { updateProfile } from '@/lib/api';
import { uploadImage } from '@/lib/upload';

export default function EditProfile() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // newly picked local uri
  const [busy, setBusy] = useState(false);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos needed', 'Enable photo access to set a profile picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled && res.assets[0]) setAvatarUri(res.assets[0].uri);
  };

  const onSave = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      let avatarPath: string | undefined;
      if (avatarUri) avatarPath = await uploadImage(avatarUri);
      await updateProfile(user.id, { displayName: displayName.trim(), bio: bio.trim(), avatarPath });
      await refreshProfile();
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ height: 56, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ flex: 1, alignItems: 'flex-start' }} accessibilityLabel="Cancel">
            <Text style={[type.callout, { color: colors.textSec }]}>Cancel</Text>
          </Pressable>
          <Text style={[type.headline, { color: colors.ink }]}>Edit profile</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Button
              label="Save"
              height={38}
              radiusOverride={19}
              fontSize={15}
              loading={busy}
              style={{ paddingHorizontal: 22 }}
              onPress={onSave}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xxl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Pressable onPress={pickAvatar}>
              <Avatar
                seed={profile?.username ?? 'me'}
                name={profile?.displayName ?? 'Me'}
                size={96}
                ring={colors.primary}
                imageUrl={avatarUri ?? profile?.avatarUrl}
              />
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg }}>
                <Feather name="camera" size={15} color={colors.white} />
              </View>
            </Pressable>
            <Pressable onPress={pickAvatar}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Change photo</Text>
            </Pressable>
          </View>

          <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <Field
            label="Bio"
            value={bio}
            onChangeText={(t) => t.length <= 160 && setBio(t)}
            placeholder="A line about you and your voice."
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
          <Text style={[type.caption, { color: colors.textMuted, textAlign: 'right' }]}>{bio.length}/160</Text>
          <Text style={[type.footnote, { color: colors.textMuted }]}>@{profile?.username} · username can&apos;t be changed</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
