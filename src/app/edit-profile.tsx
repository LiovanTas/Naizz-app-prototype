import { useState } from 'react';
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/theme';
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
        <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Button
              label={busy ? 'Saving…' : 'Save'}
              height={40}
              radiusOverride={20}
              fontSize={15}
              style={{ paddingHorizontal: 24, opacity: busy ? 0.5 : 1 }}
              onPress={onSave}
            />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>Edit profile</Text>
          <Pressable onPress={() => router.back()} style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, color: colors.textSec }}>Cancel</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 10 }}>
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
          <Text style={{ fontSize: 12, color: colors.textSec, textAlign: 'right' }}>{bio.length}/160</Text>
          <Text style={{ fontSize: 13, color: colors.textSec }}>@{profile?.username} · username can&apos;t be changed</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
