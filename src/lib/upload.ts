import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');
  return user.id;
}

export async function uploadAudio(uri: string): Promise<string> {
  const uid = await currentUserId();
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const path = `${uid}/${Date.now()}.m4a`;
  const { error } = await supabase.storage.from('voices').upload(path, decode(base64), { contentType: 'audio/m4a' });
  if (error) throw error;
  return path;
}

export async function uploadImage(uri: string): Promise<string> {
  const uid = await currentUserId();
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const ext = uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
  const path = `${uid}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('images')
    .upload(path, decode(base64), { contentType: ext === 'png' ? 'image/png' : 'image/jpeg' });
  if (error) throw error;
  return path;
}
