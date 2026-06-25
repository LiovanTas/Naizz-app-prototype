import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { Avatar } from '@/components/Avatar';
import { VoicePlayer } from '@/components/VoicePlayer';
import { Button } from '@/components/Button';
import { colors, radius } from '@/theme';
import { supabase } from '@/lib/supabase';
import { fetchMessages, sendText, sendVoice, markConversationRead, sendCallInvite } from '@/lib/messages';
import type { Message } from '@/lib/types';

// Detects invite markers like "[[room:ID]] text" / "[[call:ID]] text".
function parseInvite(body: string | null): { kind: 'room' | 'call'; id: string; rest: string } | null {
  if (!body) return null;
  const m = body.match(/^\[\[(room|call):([^\]]+)\]\]\s*(.*)$/);
  if (!m) return null;
  return { kind: m[1] as 'room' | 'call', id: m[2], rest: m[3] };
}

export default function Conversation() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; seed?: string; otherId?: string }>();
  const id = params.id;
  const name = params.name ?? 'Conversation';
  const seed = params.seed ?? name;
  const otherId = params.otherId;

  const startCall = () => {
    if (otherId) sendCallInvite(otherId).catch(() => {});
    router.push({ pathname: '/call', params: { peer: otherId, name, seed } });
  };

  const joinInvite = (inv: { kind: 'room' | 'call'; id: string }) => {
    if (inv.kind === 'room') router.push({ pathname: '/room', params: { id: inv.id } });
    else router.push({ pathname: '/call', params: { peer: inv.id, name, seed } });
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [recording, setRecording] = useState(false);
  const recSecs = Math.floor((recState.durationMillis ?? 0) / 1000);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await fetchMessages(id);
    setMessages(data);
    markConversationRead(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: reload when a new message lands in this conversation.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`conversation-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  const onSendText = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await sendText(id, body);
      load();
    } catch {
      Alert.alert('Could not send');
    }
  };

  const startRec = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone needed', 'Enable mic access to send a voice message.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  };

  const stopAndSend = async () => {
    const secs = recSecs;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setRecording(false);
    const uri = recorder.uri;
    if (!uri) return;
    try {
      await sendVoice(id, uri, secs);
      load();
    } catch {
      Alert.alert('Could not send voice');
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.senderId === meId;
    const invite = parseInvite(item.body);
    if (invite) {
      return (
        <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 18, padding: 14, gap: 10, maxWidth: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name={invite.kind === 'room' ? 'radio' : 'phone'} size={18} color={colors.primary} />
              <Text style={{ fontSize: 14.5, fontWeight: '600', color: colors.ink }}>{invite.rest}</Text>
            </View>
            <Button
              label={invite.kind === 'room' ? 'Join room' : 'Join call'}
              height={40}
              radiusOverride={20}
              fontSize={14}
              fill
              onPress={() => joinInvite(invite)}
            />
          </View>
        </View>
      );
    }
    return (
      <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
        {item.kind === 'voice' && item.audioUrl ? (
          <View style={{ width: 240 }}>
            <VoicePlayer id={item.id} url={item.audioUrl} durationSeconds={item.durationSeconds} size="sm" />
          </View>
        ) : (
          <View
            style={{
              maxWidth: '78%',
              backgroundColor: mine ? colors.primary : colors.white,
              borderRadius: 18,
              borderBottomRightRadius: mine ? 4 : 18,
              borderBottomLeftRadius: mine ? 18 : 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 15, color: mine ? colors.white : colors.ink, lineHeight: 20 }}>{item.body}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ height: 56, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 6 }}>
          <Feather name="chevron-left" size={26} color={colors.ink} />
        </Pressable>
        <Avatar seed={seed} name={name} size={36} />
        <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink }}>{name}</Text>
        <Pressable onPress={startCall} hitSlop={8} style={{ padding: 6 }}>
          <Feather name="phone" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 14, color: colors.textSec }}>Start the conversation — tap the mic to say hi.</Text>
            </View>
          }
        />

        {/* Composer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 16 }}>
            <TextInput
              value={recording ? '' : text}
              editable={!recording}
              onChangeText={setText}
              placeholder={recording ? `Recording… 0:${recSecs.toString().padStart(2, '0')}` : 'Message…'}
              placeholderTextColor={recording ? colors.live : colors.textMuted}
              style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: colors.ink }}
            />
            {text.trim() && !recording ? (
              <Pressable onPress={onSendText} hitSlop={8}>
                <Feather name="arrow-up-circle" size={26} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={recording ? stopAndSend : startRec}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: recording ? colors.live : colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={recording ? 'send' : 'mic'} size={22} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
