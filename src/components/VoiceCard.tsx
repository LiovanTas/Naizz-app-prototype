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
import { colors, radius, spacing, type } from '@/theme';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Facepile, type Face } from './Facepile';
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

  // Social proof: prefer real repliers' faces; fall back to seeded faces for likers.
  const showProof = likeCount > 0 || replies.length > 0;
  let proofFaces: Face[] = [];
  let proofLabel = '';
  let proofExtra = 0;
  if (replies.length > 0) {
    proofFaces = replies.slice(0, 3).map((r) => ({ seed: r.username, name: r.displayName }));
    proofExtra = Math.max(0, replies.length - proofFaces.length);
    const firstName = replies[0].displayName.split(' ')[0];
    proofLabel =
      replies.length === 1 ? `${firstName} replied` : `${firstName} and ${compact(replies.length - 1)} others replied`;
  } else if (likeCount > 0) {
    const n = Math.min(3, likeCount);
    proofFaces = Array.from({ length: n }, (_, i) => ({ seed: `${post.id}-fan-${i}` }));
    proofExtra = Math.max(0, likeCount - n);
    proofLabel = `Liked by ${compact(likeCount)} ${likeCount === 1 ? 'person' : 'people'}`;
  }

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar seed={post.username} name={post.displayName} size={44} imageUrl={post.avatarUrl} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[type.headline, { color: colors.ink }]}>{post.displayName}</Text>
          <Text style={[type.footnote, { color: colors.textMuted, marginTop: 1 }]}>
            @{post.username} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        {canDelete ? (
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete voice">
            <Feather name="trash-2" size={19} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="More options">
            <Feather name="more-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {post.caption ? (
        <Text style={[type.body, { color: colors.ink }]}>{post.caption}</Text>
      ) : null}

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: 200, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }} />
      ) : null}

      <VoicePlayer
        id={post.id}
        url={post.audioUrl}
        durationSeconds={post.durationSeconds}
        onFirstPlay={() => incrementPlays(post.id)}
      />

      {showProof ? (
        <Facepile faces={proofFaces} extra={proofExtra} label={proofLabel} size={22} />
      ) : null}

      <View style={{ height: 1, backgroundColor: colors.divider, marginTop: spacing.xs }} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={onLike} hitSlop={8} accessibilityRole="button" accessibilityLabel="Like" style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
          <Feather name="heart" size={19} color={liked ? colors.live : colors.textSec} style={{ marginRight: 6 }} />
          <Text style={[type.footnote, { color: liked ? colors.live : colors.textSec, fontWeight: '600' }]}>{compact(likeCount)}</Text>
        </Pressable>
        {showReplies ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
            <Feather name="message-circle" size={19} color={colors.textSec} style={{ marginRight: 6 }} />
            <Text style={[type.footnote, { color: colors.textSec, fontWeight: '600' }]}>{replies.length}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="headphones" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={[type.caption, { color: colors.textMuted }]}>{compact(post.playCount)} plays</Text>
        </View>
      </View>

      {showReplies && (replies.length > 0 || true) ? (
        <View style={{ gap: spacing.md }}>
          {replies.map((r) => (
            <ReplyRow key={r.id} reply={r} />
          ))}
          <ReplyComposer postId={post.id} ownerId={post.userId} onSent={loadReplies} />
        </View>
      ) : null}
    </Card>
  );
}
