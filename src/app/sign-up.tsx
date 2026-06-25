import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { IconButton } from '@/components/IconButton';
import { useAuth } from '@/lib/auth';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signUp({ email, password, displayName, username });
      // Gating redirects to /home once the session + profile exist.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ height: 56, justifyContent: 'center', paddingHorizontal: 8 }}>
          <IconButton name="chevron-left" onPress={() => router.back()} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Create your account</Text>
            <Text style={{ fontSize: 15, color: colors.textSec }}>Claim your handle and start posting voices.</Text>
          </View>
          <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Maya Chen" />
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="mayac"
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" />
          {error ? <Text style={{ color: colors.live, fontSize: 13 }}>{error}</Text> : null}
          <Button label={busy ? 'Creating…' : 'Create account'} fill onPress={onSubmit} />
          <Pressable onPress={() => router.replace('/sign-in')} style={{ alignItems: 'center', paddingTop: 8 }}>
            <Text style={{ color: colors.textSec, fontSize: 14 }}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
