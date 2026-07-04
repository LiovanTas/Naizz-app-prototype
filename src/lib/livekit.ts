import { Room, RoomEvent, Track } from 'livekit-client';
import { AudioSession } from '@livekit/react-native';
import { supabase } from './supabase';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL ?? '';

export const liveKitConfigured = Boolean(LIVEKIT_URL);

// Ask our Supabase Edge Function for a scoped LiveKit access token.
export async function getLiveKitToken(room: string, canPublish: boolean): Promise<string> {
  const { data, error } = await supabase.functions.invoke('livekit-token', { body: { room, canPublish } });
  if (error) throw error;
  if (!data?.token) throw new Error('No token returned from livekit-token function');
  return data.token as string;
}

// Connect to a LiveKit room and (optionally) publish the mic.
// Throws in Expo Go (no native WebRTC) — callers fall back to presence-only.
export async function connectToRoom(roomName: string, canPublish: boolean): Promise<Room> {
  if (!LIVEKIT_URL) throw new Error('EXPO_PUBLIC_LIVEKIT_URL is not set');
  const token = await getLiveKitToken(roomName, canPublish);
  await AudioSession.startAudioSession();
  const room = new Room();
  await room.connect(LIVEKIT_URL, token);
  if (canPublish) {
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch {
      /* mic will stay off */
    }
  }
  return room;
}

export async function disconnectRoom(room: Room | null): Promise<void> {
  if (!room) return;
  try {
    await room.disconnect();
  } catch {
    /* ignore */
  }
  try {
    await AudioSession.stopAudioSession();
  } catch {
    /* ignore */
  }
}

export { Room, RoomEvent, Track };
