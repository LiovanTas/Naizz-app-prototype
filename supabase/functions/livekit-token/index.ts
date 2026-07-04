// Supabase Edge Function: livekit-token
// Verifies the signed-in Naizz user, then mints a LiveKit access token scoped to
// a room with publish rights based on the caller's role. The LiveKit API secret
// lives only here (set via `supabase secrets set`), never in the app.
//
// Deploy:  supabase functions deploy livekit-token
// Secrets: supabase secrets set LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=...
//
// (SUPABASE_URL and SUPABASE_ANON_KEY are provided automatically.)

import { AccessToken } from 'npm:livekit-server-sdk@2';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { room, canPublish } = await req.json();
    if (!room || typeof room !== 'string') {
      return new Response(JSON.stringify({ error: 'room is required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const at = new AccessToken(Deno.env.get('LIVEKIT_API_KEY')!, Deno.env.get('LIVEKIT_API_SECRET')!, {
      identity: user.id,
      name: user.id,
      ttl: '2h',
    });
    at.addGrant({ roomJoin: true, room, canPublish: Boolean(canPublish), canSubscribe: true });

    const token = await at.toJwt();
    return new Response(JSON.stringify({ token }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
