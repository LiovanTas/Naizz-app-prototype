import { supabase } from './supabase';
import { notify } from './notifications';
import { publicUrl } from './upload';
import type { Connection, FullProfile, SuggestedUser } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getFullProfile(userId: string): Promise<FullProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: p } = await supabase
    .from('profiles')
    .select('id,username,display_name,bio,avatar_path')
    .eq('id', userId)
    .maybeSingle();
  if (!p) return null;

  const [followersRes, followingRes, voicesRes] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  let isFollowing = false;
  if (user && user.id !== userId) {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();
    isFollowing = !!data;
  }

  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    bio: p.bio ?? '',
    avatarUrl: p.avatar_path ? publicUrl('images', p.avatar_path) : null,
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
    voices: voicesRes.count ?? 0,
    isFollowing,
    isMe: user?.id === userId,
  };
}

async function mapConnections(profiles: any[]): Promise<Connection[]> {
  const mine = await followingIds();
  return profiles
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      bio: p.bio ?? '',
      avatarUrl: p.avatar_path ? publicUrl('images', p.avatar_path) : null,
      isFollowing: mine.has(p.id),
    }));
}

export async function listFollowing(userId: string): Promise<Connection[]> {
  const { data } = await supabase
    .from('follows')
    .select('profiles!following_id(id,username,display_name,bio,avatar_path)')
    .eq('follower_id', userId);
  return mapConnections((data ?? []).map((r: any) => r.profiles));
}

export async function listFollowers(userId: string): Promise<Connection[]> {
  const { data } = await supabase
    .from('follows')
    .select('profiles!follower_id(id,username,display_name,bio,avatar_path)')
    .eq('following_id', userId);
  return mapConnections((data ?? []).map((r: any) => r.profiles));
}

export async function toggleFollow(targetId: string, currentlyFollowing: boolean): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  if (currentlyFollowing) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
  } else {
    const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    if (error) throw error;
    notify(targetId, 'follow');
  }
}

export async function followingIds(): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
  return new Set((data ?? []).map((r) => r.following_id as string));
}

export async function suggestedUsers(limit = 6): Promise<SuggestedUser[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const exclude: string[] = [];
  if (user) {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    (data ?? []).forEach((r) => exclude.push(r.following_id as string));
    exclude.push(user.id);
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,bio')
    .order('created_at', { ascending: false })
    .limit(limit + exclude.length + 1);
  if (error) throw error;
  return (data ?? [])
    .filter((p) => !exclude.includes(p.id))
    .slice(0, limit)
    .map((p) => ({ id: p.id, username: p.username, displayName: p.display_name, bio: p.bio ?? '' }));
}
