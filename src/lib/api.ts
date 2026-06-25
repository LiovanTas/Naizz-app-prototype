import { supabase } from './supabase';
import { publicUrl, uploadAudio, uploadImage } from './upload';
import { notify } from './notifications';
import type { FeedPost, Profile } from './types';

// `profiles!user_id` disambiguates the embed (likes also links posts<->profiles).
const SELECT =
  'id,user_id,caption,audio_path,image_path,duration_seconds,play_count,created_at,profiles!user_id(username,display_name,avatar_path),likes(count)';

type PostRow = {
  id: string;
  user_id: string;
  caption: string | null;
  audio_path: string;
  image_path: string | null;
  duration_seconds: number | null;
  play_count: number | null;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_path: string | null } | null;
  likes: { count: number }[];
};

function mapPost(row: PostRow, likedIds: Set<string>): FeedPost {
  return {
    id: row.id,
    userId: row.user_id,
    caption: row.caption ?? '',
    audioPath: row.audio_path,
    audioUrl: publicUrl('voices', row.audio_path),
    imageUrl: row.image_path ? publicUrl('images', row.image_path) : null,
    avatarUrl: row.profiles?.avatar_path ? publicUrl('images', row.profiles.avatar_path) : null,
    durationSeconds: row.duration_seconds ?? 0,
    playCount: row.play_count ?? 0,
    createdAt: row.created_at,
    username: row.profiles?.username ?? 'unknown',
    displayName: row.profiles?.display_name ?? 'Unknown',
    likeCount: row.likes?.[0]?.count ?? 0,
    likedByMe: likedIds.has(row.id),
  };
}

async function myLikedIds(): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
  return new Set((data ?? []).map((r) => r.post_id as string));
}

async function myFollowingIds(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
  return (data ?? []).map((r) => r.following_id as string);
}

export async function fetchFeed(sort: 'latest' | 'trending' | 'following'): Promise<FeedPost[]> {
  const liked = await myLikedIds();
  let query = supabase.from('posts').select(SELECT);
  if (sort === 'following') {
    const ids = await myFollowingIds();
    if (ids.length === 0) return [];
    query = query.in('user_id', ids).order('created_at', { ascending: false });
  } else {
    query = query.order(sort === 'trending' ? 'play_count' : 'created_at', { ascending: false });
  }
  const { data, error } = await query.limit(50);
  if (error) throw error;
  return (data as unknown as PostRow[]).map((r) => mapPost(r, liked));
}

export async function fetchUserPosts(userId: string): Promise<FeedPost[]> {
  const liked = await myLikedIds();
  const { data, error } = await supabase
    .from('posts')
    .select(SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as PostRow[]).map((r) => mapPost(r, liked));
}

export async function fetchLikedPosts(userId: string): Promise<FeedPost[]> {
  const liked = await myLikedIds();
  const { data: likeRows } = await supabase.from('likes').select('post_id').eq('user_id', userId);
  const ids = (likeRows ?? []).map((r) => r.post_id as string);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('posts').select(SELECT).in('id', ids).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as PostRow[]).map((r) => mapPost(r, liked));
}

export async function createPost(
  uri: string,
  durationSeconds: number,
  caption: string,
  imageUri?: string | null,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to post.');
  const audioPath = await uploadAudio(uri);
  const imagePath = imageUri ? await uploadImage(imageUri) : null;
  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    caption: caption.trim(),
    audio_path: audioPath,
    image_path: imagePath,
    duration_seconds: Math.round(durationSeconds),
  });
  if (error) throw error;
}

export async function deletePost(post: FeedPost): Promise<void> {
  await supabase.storage.from('voices').remove([post.audioPath]);
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) throw error;
}

export async function toggleLike(postId: string, currentlyLiked: boolean, ownerId?: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');
  if (currentlyLiked) {
    const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    if (error) throw error;
    if (ownerId && ownerId !== user.id) notify(ownerId, 'like', postId);
  }
}

export async function incrementPlays(postId: string): Promise<void> {
  await supabase.rpc('increment_plays', { pid: postId });
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id,username,display_name,bio,avatar_path')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    bio: data.bio ?? '',
    avatarUrl: data.avatar_path ? publicUrl('images', data.avatar_path) : null,
  };
}

export async function updateProfile(
  userId: string,
  fields: { displayName?: string; bio?: string; avatarPath?: string },
): Promise<void> {
  const patch: Record<string, string> = {};
  if (fields.displayName !== undefined) patch.display_name = fields.displayName;
  if (fields.bio !== undefined) patch.bio = fields.bio;
  if (fields.avatarPath !== undefined) patch.avatar_path = fields.avatarPath;
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}
