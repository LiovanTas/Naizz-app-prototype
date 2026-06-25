import { supabase } from './supabase';
import { publicUrl, uploadAudio } from './upload';
import type { ConversationSummary, Message } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function me(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  return user.id;
}

export async function getOrCreateDM(otherUserId: string): Promise<string> {
  const uid = await me();
  const { data: mine } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', uid);
  const myConvos = (mine ?? []).map((r) => r.conversation_id as string);
  if (myConvos.length) {
    const { data: shared } = await supabase
      .from('conversation_members')
      .select('conversation_id,conversations(is_group)')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvos);
    const dm = (shared ?? []).find((r: any) => r.conversations && !r.conversations.is_group);
    if (dm) return (dm as any).conversation_id as string;
  }
  const { data: convo, error } = await supabase
    .from('conversations')
    .insert({ is_group: false, created_by: uid })
    .select('id')
    .single();
  if (error) throw error;
  await supabase.from('conversation_members').insert({ conversation_id: convo.id, user_id: uid });
  await supabase.from('conversation_members').insert({ conversation_id: convo.id, user_id: otherUserId });
  return convo.id as string;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const uid = await me();
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id,last_read_at,conversations(id,is_group,title,last_message_at)')
    .eq('user_id', uid);
  const rows = (memberships ?? []) as any[];
  const summaries: ConversationSummary[] = [];

  for (const m of rows) {
    const cid = m.conversation_id as string;
    const { data: others } = await supabase
      .from('conversation_members')
      .select('user_id,profiles(username,display_name)')
      .eq('conversation_id', cid)
      .neq('user_id', uid)
      .limit(1);
    const other = (others ?? [])[0] as any;
    const { data: lastArr } = await supabase
      .from('messages')
      .select('kind,body,duration_seconds,created_at,sender_id')
      .eq('conversation_id', cid)
      .order('created_at', { ascending: false })
      .limit(1);
    const last = (lastArr ?? [])[0] as any;
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', cid)
      .gt('created_at', m.last_read_at)
      .neq('sender_id', uid);

    summaries.push({
      id: cid,
      isGroup: m.conversations?.is_group ?? false,
      title: m.conversations?.title ?? null,
      otherUserId: other?.user_id ?? '',
      otherUsername: other?.profiles?.username ?? 'unknown',
      otherDisplayName: m.conversations?.title ?? other?.profiles?.display_name ?? 'Conversation',
      lastMessage: last?.body ?? '',
      lastKind: (last?.kind ?? 'text') as 'text' | 'voice',
      lastDuration: last?.duration_seconds ?? 0,
      lastSenderIsMe: last?.sender_id === uid,
      lastAt: m.conversations?.last_message_at ?? new Date(0).toISOString(),
      unread: count ?? 0,
    });
  }
  summaries.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  return summaries;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id,conversation_id,sender_id,kind,body,audio_path,duration_seconds,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    kind: r.kind,
    body: r.body,
    audioUrl: r.audio_path ? publicUrl('voices', r.audio_path) : null,
    durationSeconds: r.duration_seconds ?? 0,
    createdAt: r.created_at,
  }));
}

export async function sendText(conversationId: string, body: string): Promise<void> {
  const uid = await me();
  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: uid, kind: 'text', body: body.trim() });
  if (error) throw error;
}

export async function sendVoice(conversationId: string, uri: string, durationSeconds: number): Promise<void> {
  const uid = await me();
  const audioPath = await uploadAudio(uri);
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: uid,
    kind: 'voice',
    audio_path: audioPath,
    duration_seconds: Math.round(durationSeconds),
  });
  if (error) throw error;
}

// Invite markers are embedded in a normal text message; the conversation
// screen parses them to render a "Join" button.
export async function sendRoomInvite(otherUserId: string, roomId: string): Promise<void> {
  const cid = await getOrCreateDM(otherUserId);
  await sendText(cid, `[[room:${roomId}]] Join my live room`);
}

export async function sendCallInvite(otherUserId: string): Promise<void> {
  const uid = await me();
  const cid = await getOrCreateDM(otherUserId);
  await sendText(cid, `[[call:${uid}]] Calling you on Naizz`);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}
