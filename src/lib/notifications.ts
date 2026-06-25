import { supabase } from './supabase';
import type { AppNotification } from './types';

type Row = {
  id: string;
  type: string;
  actor_id: string;
  post_id: string | null;
  created_at: string;
  read: boolean;
  profiles: { username: string; display_name: string } | null;
};

// Fire-and-forget notification create (actor = current user).
export async function notify(
  recipientId: string,
  type: 'like' | 'follow' | 'reply',
  postId?: string | null,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === recipientId) return;
  await supabase
    .from('notifications')
    .insert({ recipient_id: recipientId, actor_id: user.id, type, post_id: postId ?? null });
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,type,actor_id,post_id,created_at,read,profiles!actor_id(username,display_name)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    type: r.type as AppNotification['type'],
    actorId: r.actor_id,
    actorUsername: r.profiles?.username ?? 'unknown',
    actorDisplayName: r.profiles?.display_name ?? 'Someone',
    postId: r.post_id,
    createdAt: r.created_at,
    read: r.read,
  }));
}

export async function unreadNotificationCount(): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  return count ?? 0;
}

export async function markNotificationsRead(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ read: true }).eq('recipient_id', user.id).eq('read', false);
}
