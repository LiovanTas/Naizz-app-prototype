import { useState } from 'react';
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type, spacing } from '@/theme';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { createRoom } from '@/lib/rooms';

export default function CreateRoom() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const onStart = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await createRoom(title);
      router.replace({ pathname: '/room', params: { id } });
    } catch (e) {
      Alert.alert('Could not start room', e instanceof Error ? e.message : 'Try again.');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ height: 56, paddingHorizontal: spacing.gutter, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ flex: 1 }} accessibilityLabel="Cancel">
            <Text style={[type.callout, { color: colors.textSec }]}>Cancel</Text>
          </Pressable>
          <Text style={[type.headline, { color: colors.ink }]}>Start a room</Text>
          <View style={{ flex: 1 }} />
        </View>

        <View style={{ padding: spacing.xxl, gap: spacing.lg }}>
          <Text style={[type.callout, { color: colors.textSec, lineHeight: 22 }]}>
            Give your room a name. You&apos;ll go live as the host — friends can drop in to listen or speak.
          </Text>
          <Field label="Room name" value={title} onChangeText={setTitle} placeholder="e.g. Building in public" autoFocus />
          <Button label="Go live" icon="radio" loading={busy} fill onPress={onStart} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
