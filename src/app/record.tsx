import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { colors, radius } from '@/theme';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Waveform } from '@/components/Waveform';
import { createPost } from '@/lib/api';
import { formatDuration } from '@/lib/format';

const MAX_SECONDS = 180;
type Phase = 'idle' | 'recording' | 'recorded';

export default function Record() {
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [phase, setPhase] = useState<Phase>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const liveSeconds = Math.floor((recorderState.durationMillis ?? 0) / 1000);
  const shownSeconds = phase === 'recorded' ? duration : liveSeconds;

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone needed', 'Enable microphone access to record a voice.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  };

  const stop = async () => {
    const finalSeconds = liveSeconds;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setUri(recorder.uri ?? null);
    setDuration(finalSeconds);
    setPhase('recorded');
  };

  // Auto-stop at the max length.
  useEffect(() => {
    if (phase === 'recording' && liveSeconds >= MAX_SECONDS) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSeconds, phase]);

  const reRecord = () => {
    setUri(null);
    setDuration(0);
    setPhase('idle');
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos needed', 'Enable photo access to attach an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const cancel = async () => {
    if (phase === 'recording') {
      try {
        await recorder.stop();
      } catch {
        /* ignore */
      }
    }
    router.back();
  };

  const post = async () => {
    if (!uri || posting) return;
    setPosting(true);
    try {
      await createPost(uri, duration, caption, imageUri);
      router.replace('/home');
    } catch (e) {
      Alert.alert('Could not post', e instanceof Error ? e.message : 'Please try again.');
      setPosting(false);
    }
  };

  const canPost = phase === 'recorded' && !!uri;
  const statusLabel = phase === 'recording' ? 'REC' : phase === 'recorded' ? 'READY' : 'TAP TO RECORD';
  const playedBars = phase === 'recorded' ? 40 : Math.min(40, liveSeconds * 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ height: 56, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Button
              label={posting ? 'Posting…' : 'Post'}
              height={40}
              radiusOverride={20}
              fontSize={15}
              style={{ paddingHorizontal: 24, opacity: canPost && !posting ? 1 : 0.45 }}
              onPress={canPost ? post : undefined}
            />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>New voice</Text>
          <Pressable onPress={cancel} style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, color: colors.textSec }}>Cancel</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
          {/* Status pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: colors.cream,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            {phase === 'recording' ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live }} /> : null}
            <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.5, color: phase === 'recording' ? colors.live : colors.textSec }}>
              {statusLabel}
            </Text>
          </View>

          <Text style={{ fontSize: 72, fontWeight: '800', color: colors.ink, marginTop: 28 }}>{formatDuration(shownSeconds)}</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>of 3:00 max</Text>

          <View style={{ alignSelf: 'stretch', height: 70, justifyContent: 'center', paddingHorizontal: 28, marginTop: 24 }}>
            <Waveform bars={40} max={56} barWidth={3.5} gap={3} played={playedBars} color={colors.primary} trackColor={colors.border} />
          </View>

          <View style={{ flex: 1 }} />

          {/* Big record/pause button */}
          <Pressable
            onPress={phase === 'recording' ? stop : phase === 'recorded' ? reRecord : start}
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: 'rgba(21,115,166,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name={phase === 'recording' ? 'pause' : phase === 'recorded' ? 'refresh-cw' : 'mic'} size={44} color={colors.white} />
            </View>
          </Pressable>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 18 }}>
            {phase === 'recording' ? 'Tap to pause' : phase === 'recorded' ? 'Tap to record again' : 'Tap the mic to start'}
          </Text>

          <View style={{ flex: 1 }} />

          {/* Composer */}
          <View style={{ alignSelf: 'stretch', paddingHorizontal: 18, paddingBottom: 8, gap: 12 }}>
            {imageUri ? (
              <View>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: 140, borderRadius: radius.lg }} />
                <Pressable
                  onPress={() => setImageUri(null)}
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 5 }}
                >
                  <Feather name="x" size={16} color={colors.white} />
                </Pressable>
              </View>
            ) : null}
            <View
              style={{
                backgroundColor: colors.cream,
                borderRadius: radius.lg,
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              <TextInput
                value={caption}
                onChangeText={(t) => t.length <= 120 && setCaption(t)}
                placeholder="Add a caption…"
                placeholderTextColor={colors.textMuted}
                style={{ fontSize: 15, color: colors.ink, paddingVertical: 14 }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Chip label="Topic" icon="plus" />
              <Chip label={imageUri ? 'Photo added' : 'Photo'} icon="image" active={!!imageUri} onPress={pickImage} />
              <Chip label="Everyone" icon="chevron-down" />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
