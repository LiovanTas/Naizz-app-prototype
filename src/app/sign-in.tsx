import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { IconButton } from '@/components/IconButton';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      // Root layout gating redirects to /home on success.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
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
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Welcome back</Text>
            <Text style={{ fontSize: 15, color: colors.textSec }}>Sign in to keep talking.</Text>
          </View>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          {error ? <Text style={{ color: colors.live, fontSize: 13 }}>{error}</Text> : null}
          <Button label={busy ? 'Signing in…' : 'Sign in'} fill onPress={onSubmit} />
          <Pressable onPress={() => router.replace('/sign-up')} style={{ alignItems: 'center', paddingTop: 8 }}>
            <Text style={{ color: colors.textSec, fontSize: 14 }}>
              New here? <Text style={{ color: colors.primary, fontWeight: '600' }}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
