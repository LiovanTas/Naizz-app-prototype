import { supabase } from './supabase';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type IncomingCall = {
  callId: string;
  callerId: string;
  callerName: string;
  callerUsername: string;
};

export async function placeCall(calleeId: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in first.');
  const { data, error } = await supabase
    .from('calls')
    .insert({ caller_id: user.id, callee_id: calleeId, status: 'ringing' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateCallStatus(
  callId: string,
  status: 'accepted' | 'declined' | 'ended' | 'missed',
): Promise<void> {
  await supabase.from('calls').update({ status }).eq('id', callId);
}

// Caller / callee watch a specific call for status changes.
export function subscribeCall(callId: string, onStatus: (status: string) => void): () => void {
  const channel = supabase
    .channel(`call-${callId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
      (payload: any) => onStatus(payload.new.status as string),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Global: fire when someone rings the current user.
export async function subscribeIncomingCalls(onIncoming: (c: IncomingCall) => void): Promise<() => void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return () => {};
  const channel = supabase
    .channel(`incoming-${user.id}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'calls', filter: `callee_id=eq.${user.id}` },
      async (payload: any) => {
        const row = payload.new;
        if (row.status !== 'ringing') return;
        const { data: prof } = await supabase
          .from('profiles')
          .select('username,display_name')
          .eq('id', row.caller_id)
          .maybeSingle();
        onIncoming({
          callId: row.id,
          callerId: row.caller_id,
          callerName: prof?.display_name ?? 'Someone',
          callerUsername: prof?.username ?? 'unknown',
        });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
