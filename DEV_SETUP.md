# Naizz — Developer Setup

Naizz is a **voice-first social app**: every post is your voice. Feed, voice replies,
DMs (text + voice), profiles/follows, live audio **rooms**, and **1:1 calls** (ring /
accept / decline).

**Stack:** Expo (managed) · React Native · TypeScript · Expo Router · Supabase
(Postgres, Auth, Storage, Realtime, Edge Functions) · **LiveKit** (real‑time audio).

> ⚠️ **Expo Go does NOT work** for this app. LiveKit ships native WebRTC code, which
> Expo Go can't load. You run it through a **development build** (a small custom app
> called *naizz*) + the Metro dev server. Details below.

---

## 1. Prerequisites
- **Node.js 18+ LTS** and **Git**
- An **Android phone** (or Android emulator). iOS needs a Mac + its own build.
- **Repo access** to `git@github.com:LiovanTas/Naizz-app-prototype.git` (ask Liovan to add you).

## 2. Clone & install
```bash
git clone git@github.com:LiovanTas/Naizz-app-prototype.git
cd Naizz-app-prototype
git checkout audio      # the branch with LiveKit real audio
npm install
```

## 3. Environment (`.env`)
`.env` is git‑ignored, so create it yourself in the project root. Use these **shared
demo backend** values (they're the public publishable key + LiveKit URL — safe to use;
the real LiveKit secret lives only in Supabase, never in the app):

```
EXPO_PUBLIC_SUPABASE_URL=https://hyutvtkeijmwbxhywkco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EdPj9xwHFY83sTA9b5egoQ_mjdYFXL0
EXPO_PUBLIC_LIVEKIT_URL=wss://naizz-9ksoq2ku.livekit.cloud
```

You **do not** need to create your own Supabase project or run any SQL — the database,
storage buckets, and the `livekit-token` Edge Function are already deployed on this
shared project. (Schema history lives in `supabase/*.sql` for reference.)

## 4. Install the development build (one time)
Download and install the **naizz** dev‑client APK on your Android phone
(allow "install from unknown sources" once):

**https://expo.dev/artifacts/eas/BMXF_9MyXq1PNWrVdhykHmENq68xzVcsSh_HhJsEh-M.apk**

This is just the native shell — it loads the JavaScript from *your* Metro server, so
you point it at your own machine. You only reinstall it if **native** dependencies
change (rare). To make your own instead, see "Building your own dev client" below.

## 5. Run it
```bash
# macOS / Linux:
npx expo start --dev-client

# Windows (PowerShell blocks the npx.ps1 wrapper):
npx.cmd expo start --dev-client
```
Then open the **naizz** app on your phone (not Expo Go) and connect:
- **Same Wi‑Fi** as your computer → your server shows under **"Development servers,"** tap it (or scan the QR *inside the naizz app*).
- **Different networks / Wi‑Fi blocks it** → run with a tunnel: `npx expo start --dev-client --tunnel` (say yes to installing `@expo/ngrok`), then scan the tunnel QR.

JavaScript edits hot‑reload instantly — same DX as Expo Go, just through the naizz app.

## 6. Test live audio (needs two accounts)
Audio flows through LiveKit Cloud over the internet, so devices don't need to share a network.
1. Sign up **two accounts** (two phones, or phone + emulator).
2. Make them **follow each other**.
3. **1:1 call:** Home → 📞 icon → tap the person → they get an incoming‑call screen → **Accept** → talk.
4. **Room:** **Start a room** → tap **invite** (person‑plus) → pick the other → both tap the **mic** to unmute.
5. **Allow the microphone** permission the first time.

---

## Project structure
```
src/app/            screens (Expo Router file-based routing)
  (tabs)/           Home · For You · Activity · You  (+ center Record button)
  room.tsx call.tsx calls.tsx incoming-call.tsx messages.tsx conversation.tsx ...
src/components/     UI components (VoiceCard, VoicePlayer, Avatar, GlobalOverlays, ...)
src/lib/            supabase client, api, auth, livekit, calls, rooms, messages, ...
src/theme/          design tokens (colors/spacing/typography)
supabase/           schema.sql → schema_v2 → v3 → v4  +  functions/livekit-token
```

## Important constraints (don't trip on these)
- **Expo SDK is pinned to 54 — do not bump it.** There's a deliberate
  `"overrides": { "expo-asset": "~12.0.13" }` in `package.json` to keep an SDK‑56
  straggler off; leave it. Run **`npx expo-doctor` (expect 18/18)** before any native build.
- **Never commit `.env`** (it's git‑ignored). Same for `supabase/.temp/`.
- The LiveKit **API secret** is not in this repo — it's a Supabase function secret.
- Windows: if `npx expo …` says *"running scripts is disabled,"* use `npx.cmd …`,
  or run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Building your own dev client (only if you change native deps)
Requires an Expo account (and being added to the `liovans-team` EAS project, or use
your own via `eas init`):
```bash
npm i -g eas-cli
eas login
eas build --platform android --profile development   # ~10–15 min, gives an APK link
```
Install that APK, then `expo start --dev-client`.

## Backend / DB changes
The Supabase project is shared. If you add tables or policies, create a new
`supabase/schema_vN.sql` and run it in the Supabase SQL editor (ask Liovan for access),
and keep the edge function in `supabase/functions/` in sync.

## Non‑developer testers
People who just want to *use* the app (no coding) don't need any of this — give them a
standalone **preview** build APK instead (`eas build --profile preview`); it runs on its
own with no Metro server.
