import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type, spacing } from '@/theme';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { AppHeader } from '@/components/AppHeader';
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
        <AppHeader onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: 24, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.title1, { color: colors.text }]}>Welcome back</Text>
            <Text style={[type.callout, { color: colors.textSec }]}>Sign in to keep talking.</Text>
          </View>
          <Field
            label="Email"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field label="Password" icon="lock" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" error={error ?? undefined} />
          <Button label="Sign in" fill loading={busy} onPress={onSubmit} />
          <Pressable onPress={() => router.replace('/sign-up')} style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <Text style={[type.subhead, { color: colors.textSec }]}>
              New here? <Text style={{ color: colors.primary, fontWeight: '600' }}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
