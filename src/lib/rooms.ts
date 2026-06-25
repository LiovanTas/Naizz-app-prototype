import { supabase } from './supabase';
import type { RoomSummary, RoomMember } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROOM_SELECT =
  'id,host_id,title,is_live,created_at,profiles!host_id(username,display_name),room_members(count)';

function mapRoom(r: any): RoomSummary {
  return {
    id: r.id,
    hostId: r.host_id,
    title: r.title,
    isLive: r.is_live,
    createdAt: r.created_at,
    hostUsername: r.profiles?.username ?? 'unknown',
    hostDisplayName: r.profiles?.display_name ?? 'Host',
    listeners: r.room_members?.[0]?.count ?? 0,
  };
}

export async function listLiveRooms(): Promise<RoomSummary[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_SELECT)
    .eq('is_live', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as any[]).map(mapRoom);
}

export async function getRoom(roomId: string): Promise<RoomSummary | null> {
  const { data } = await supabase.from('rooms').select(ROOM_SELECT).eq('id', roomId).maybeSingle();
  return data ? mapRoom(data) : null;
}

export async function createRoom(title: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  const { data, error } = await supabase
    .from('rooms')
    .insert({ host_id: user.id, title: title.trim() || 'Live room', is_live: true })
    .select('id')
    .single();
  if (error) throw error;
  await supabase
    .from('room_members')
    .insert({ room_id: data.id, user_id: user.id, role: 'host', muted: false });
  return data.id as string;
}

export async function joinRoom(roomId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  await supabase
    .from('room_members')
    .upsert({ room_id: roomId, user_id: user.id, role: 'listener', muted: true }, { onConflict: 'room_id,user_id', ignoreDuplicates: true });
}

export async function leaveRoom(roomId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data: room } = await supabase.from('rooms').select('host_id').eq('id', roomId).maybeSingle();
  await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', user.id);
  if (room && room.host_id === user.id) {
    await supabase.from('rooms').update({ is_live: false }).eq('id', roomId);
  }
}

export async function listRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data, error } = await supabase
    .from('room_members')
    .select('user_id,role,muted,profiles(username,display_name)')
    .eq('room_id', roomId);
  if (error) throw error;
  return (data as any[]).map((r) => ({
    userId: r.user_id,
    role: r.role,
    muted: r.muted,
    username: r.profiles?.username ?? 'unknown',
    displayName: r.profiles?.display_name ?? 'User',
  }));
}

export async function setMuted(roomId: string, muted: boolean): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('room_members').update({ muted }).eq('room_id', roomId).eq('user_id', user.id);
}

export async function setSpeaking(roomId: string, speaker: boolean): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('room_members')
    .update({ role: speaker ? 'speaker' : 'listener', muted: !speaker })
    .eq('room_id', roomId)
    .eq('user_id', user.id);
}
