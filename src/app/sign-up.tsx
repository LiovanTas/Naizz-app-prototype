import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type, spacing } from '@/theme';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { AppHeader } from '@/components/AppHeader';
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
        <AppHeader onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: 24, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.title1, { color: colors.text }]}>Create your account</Text>
            <Text style={[type.callout, { color: colors.textSec }]}>Claim your handle and start posting voices.</Text>
          </View>
          <Field label="Display name" icon="user" value={displayName} onChangeText={setDisplayName} placeholder="Maya Chen" />
          <Field
            label="Username"
            icon="at-sign"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="mayac"
          />
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
          <Field label="Password" icon="lock" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" error={error ?? undefined} />
          <Button label="Create account" fill loading={busy} onPress={onSubmit} />
          <Pressable onPress={() => router.replace('/sign-in')} style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <Text style={[type.subhead, { color: colors.textSec }]}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
