import { supabase } from './supabase';
import { publicUrl, uploadAudio } from './upload';
import { notify } from './notifications';
import type { Reply } from './types';

type Row = {
  id: string;
  post_id: string;
  user_id: string;
  audio_path: string;
  duration_seconds: number;
  created_at: string;
  profiles: { username: string; display_name: string } | null;
};

export async function fetchReplies(postId: string): Promise<Reply[]> {
  const { data, error } = await supabase
    .from('replies')
    .select('id,post_id,user_id,audio_path,duration_seconds,created_at,profiles!user_id(username,display_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    postId: r.post_id,
    userId: r.user_id,
    audioUrl: publicUrl('voices', r.audio_path),
    durationSeconds: r.duration_seconds ?? 0,
    createdAt: r.created_at,
    username: r.profiles?.username ?? 'unknown',
    displayName: r.profiles?.display_name ?? 'Unknown',
  }));
}

export async function replyCounts(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const { data } = await supabase.from('replies').select('post_id').in('post_id', postIds);
  const out: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    const id = r.post_id as string;
    out[id] = (out[id] ?? 0) + 1;
  });
  return out;
}

export async function createReply(
  postId: string,
  uri: string,
  durationSeconds: number,
  postOwnerId?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  const audioPath = await uploadAudio(uri);
  const { error } = await supabase.from('replies').insert({
    post_id: postId,
    user_id: user.id,
    audio_path: audioPath,
    duration_seconds: Math.round(durationSeconds),
  });
  if (error) throw error;
  if (postOwnerId) notify(postOwnerId, 'reply', postId);
}
