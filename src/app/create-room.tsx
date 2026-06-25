import { useState } from 'react';
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
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
        <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => router.back()} style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, color: colors.textSec }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>Start a room</Text>
          <View style={{ flex: 1 }} />
        </View>

        <View style={{ padding: 24, gap: 16 }}>
          <Text style={{ fontSize: 15, color: colors.textSec, lineHeight: 21 }}>
            Give your room a name. You&apos;ll go live as the host — friends can drop in to listen or speak.
          </Text>
          <Field label="Room name" value={title} onChangeText={setTitle} placeholder="e.g. Building in public" autoFocus />
          <Button label={busy ? 'Going live…' : 'Go live'} icon="mic" fill onPress={onStart} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
