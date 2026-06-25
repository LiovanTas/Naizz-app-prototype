import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { colors, radius, spacing } from '@/theme';
import { Avatar } from './Avatar';
import { VoicePlayer } from './VoicePlayer';
import { incrementPlays, toggleLike, deletePost } from '@/lib/api';
import { fetchReplies, createReply } from '@/lib/replies';
import { compact, timeAgo } from '@/lib/format';
import type { FeedPost, Reply } from '@/lib/types';

function ReplyComposer({ postId, ownerId, onSent }: { postId: string; ownerId: string; onSent: () => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const secs = Math.floor((state.durationMillis ?? 0) / 1000);

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone needed', 'Enable mic access to reply.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  };

  const stopAndSend = async () => {
    const finalSecs = secs;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setRecording(false);
    const uri = recorder.uri;
    if (!uri) return;
    setBusy(true);
    try {
      await createReply(postId, uri, finalSecs, ownerId);
      onSent();
    } catch {
      Alert.alert('Could not send reply', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={recording ? stopAndSend : start}
      disabled={busy}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: recording ? colors.live : colors.cardAlt,
        borderRadius: radius.lg,
        paddingVertical: 13,
      }}
    >
      <Feather name="mic" size={18} color={recording ? colors.white : colors.primary} />
      <Text style={{ fontSize: 14.5, fontWeight: '600', color: recording ? colors.white : colors.primary }}>
        {busy ? 'Sending…' : recording ? `Tap to send · 0:${secs.toString().padStart(2, '0')}` : 'Reply with your voice'}
      </Text>
    </Pressable>
  );
}

function ReplyRow({ reply }: { reply: Reply }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Avatar seed={reply.username} name={reply.displayName} size={30} />
      <View style={{ flex: 1, gap: 3 }}>
        <VoicePlayer id={reply.id} url={reply.audioUrl} durationSeconds={reply.durationSeconds} size="sm" />
        <Text style={{ fontSize: 11.5, color: colors.textMuted, marginLeft: 4 }}>
          {reply.displayName} · voice reply
        </Text>
      </View>
    </View>
  );
}

type CardProps = {
  post: FeedPost;
  onChanged?: () => void;
  canDelete?: boolean;
  showReplies?: boolean;
};

export function VoiceCard({ post, onChanged, canDelete, showReplies }: CardProps) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [replies, setReplies] = useState<Reply[]>([]);

  const loadReplies = useCallback(() => {
    if (!showReplies) return;
    fetchReplies(post.id)
      .then(setReplies)
      .catch(() => {});
  }, [post.id, showReplies]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const onLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      await toggleLike(post.id, wasLiked, post.userId);
    } catch {
      setLiked(wasLiked);
      setLikeCount(post.likeCount);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete voice', 'This will permanently remove this post.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post);
            onChanged?.();
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 18, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar seed={post.username} name={post.displayName} size={44} imageUrl={post.avatarUrl} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{post.displayName}</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 1 }}>
            @{post.username} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        {canDelete ? (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Feather name="trash-2" size={19} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Feather name="more-horizontal" size={20} color={colors.textMuted} />
        )}
      </View>

      {post.caption ? (
        <Text style={{ fontSize: 16, color: colors.ink, lineHeight: 23 }}>{post.caption}</Text>
      ) : null}

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: 200, borderRadius: radius.lg }} />
      ) : null}

      <VoicePlayer
        id={post.id}
        url={post.audioUrl}
        durationSeconds={post.durationSeconds}
        onFirstPlay={() => incrementPlays(post.id)}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={onLike} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 22 }}>
          <Feather name="heart" size={19} color={liked ? colors.live : colors.textSec} style={{ marginRight: 6 }} />
          <Text style={{ color: liked ? colors.live : colors.textSec, fontSize: 13.5 }}>{compact(likeCount)}</Text>
        </Pressable>
        {showReplies ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 22 }}>
            <Feather name="message-circle" size={19} color={colors.textSec} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.textSec, fontSize: 13.5 }}>{replies.length}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="play" size={15} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{compact(post.playCount)} plays</Text>
        </View>
      </View>

      {showReplies ? (
        <View style={{ gap: 12 }}>
          {replies.map((r) => (
            <ReplyRow key={r.id} reply={r} />
          ))}
          <ReplyComposer postId={post.id} ownerId={post.userId} onSent={loadReplies} />
        </View>
      ) : null}
    </View>
  );
}
