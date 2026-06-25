import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { PlaybackProvider } from '@/lib/playback';
import { colors } from '@/theme';

function Splash() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
      <Text style={{ fontSize: 34, fontWeight: '700', color: colors.primary, marginBottom: 16 }}>Naizz</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Allow audio to play even when the device is on silent.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (loading) return;
    const seg = segments as string[];
    const inAuthArea = seg.length === 0 || seg[0] === 'sign-in' || seg[0] === 'sign-up';
    if (!session && !inAuthArea) {
      router.replace('/');
    } else if (session && inAuthArea) {
      router.replace('/home');
    }
  }, [session, loading, segments, router]);

  if (loading) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="record" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="create-room" options={{ presentation: 'modal' }} />
      <Stack.Screen name="messages" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="new-message" options={{ presentation: 'modal' }} />
      <Stack.Screen name="room" />
      <Stack.Screen name="call" />
      <Stack.Screen name="connections" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PlaybackProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </PlaybackProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
