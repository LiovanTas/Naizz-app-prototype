# Naizz — Product Redesign & Design System

*Voice-first social app · React Native (Expo Router) · redesign pass by a senior product-design lens*

This document is the written half of the work. The other half is **shipped in code** — the
theme, components, and all 17 screens have been rewritten to the system described below. Where
this doc says "Final," the corresponding screen file already reflects it.

---

## How to read this

- **Phase 1** — a deliberately harsh audit of what made the app read as a prototype.
- **Phase 2** — product thinking: flow, friction, emphasis, what to cut.
- **Phase 3** — per-screen: *Problems → UX improvements → UI improvements → Reasoning → Final*.
- **Phase 4** — the design system reference (tokens shipped in `src/theme/index.ts`).
- **Phase 5** — production notes and known gaps.
- **Master Prompt** — one prompt that recreates the whole redesigned app from scratch.

---

## Phase 1 — Audit

The app was already *competent*. Good information architecture, a real feature set (voice posts,
replies, live rooms, 1:1 calls, voice DMs), a thought-through warm palette. But a handful of
systemic issues made it feel like a high-fidelity Figma export rather than a product you'd trust
with your data.

### The five tells

**1. No elevation. Everything was flat.**
White cards sat on a saturated flat-blue canvas (`#DCEDF3`) with *zero* shadow. Nothing lifted off
the page, so the eye couldn't tell foreground from background. This single thing is the strongest
"prototype" signal a UI can send — real products use light to create depth. *Why it hurts:* without
elevation, grouping is ambiguous, tap targets feel inert, and the whole screen reads as a wireframe.

**2. Magic numbers everywhere.**
Font sizes were 11.5, 12.5, 13.5, 14.5, 15.5, 16, 18, 22, 26 — nine sizes with no scale. Spacing
was 14/16/18/22/24/28 picked by feel. Radii were 12/14/16/18/20/26 mixed within the same screens.
The `spacing` and `radius` tokens existed but were barely used. *Why it hurts:* inconsistency is
subconscious — users can't name it, but it makes a product feel "off" and untrustworthy. Rhythm is
what separates Linear from a weekend build.

**3. Loading was a spinner; empty was gray text.**
Every screen fell back to a centered `ActivityIndicator` and every empty state was one line of muted
text. *Why it hurts:* spinners make the app feel slow (no sense of what's coming); bare-text empties
waste the highest-intent moment a user has — the one where they need a nudge to act.

**4. Low-contrast, inconsistent typography.**
`textMuted` (`#A4937D`) failed WCAG AA on white (~2.8:1) yet carried real content (handles,
timestamps, captions). Headers ranged 700–800 weight arbitrarily; the Home title was brand-blue
while every other tab title was ink — no rule. *Why it hurts:* accessibility failures exclude users
and signal carelessness; arbitrary weight/color choices read as visual noise.

**5. Repeated, slightly-different chrome.**
Every screen hand-rolled its own 56px header. Back chevrons were 26px here, in a 6px-padded box
there, with 8/10/12/16 paddings. The Record and Edit-Profile screens even put the primary action
(*Post* / *Save*) on the **left** and *Cancel* on the right — backwards from every iOS convention.
*Why it hurts:* muscle memory breaks; the app feels assembled rather than designed.

### Smaller issues found

- Inert affordances: the `•••` "more" on every feed card did nothing; tapping it gave no feedback.
- The reply composer was always expanded on every Home card, making the feed heavy and slow to scan.
- Search inputs used a borderless cream fill; form inputs used a bordered white fill — two input
  languages in one app.
- Tab bar used shouty uppercase labels (`HOME / FOR YOU / ACTIVITY / YOU`) and a 5px dot indicator.
- Icon buttons had no `accessibilityLabel`; screen readers announced raw glyph names or nothing.
- No press feedback beyond a flat opacity dip — nothing felt tactile.

---

## Phase 2 — Product thinking

Before pixels, the questions that matter.

**Is the core flow intuitive?** Mostly yes, and it's the app's strength: the raised center mic is a
great, opinionated primary action ("the thing you do here is *talk*"). We kept it and made it more
physical (shadow + press-scale). The voice "pill" player is a genuinely strong, ownable component —
we protected it and only deepened it.

**Where was the friction?**
- *Posting:* the reversed Cancel/Post header created a real hesitation cost. Fixed to the universal
  `Cancel · Title · Post` layout, with **Post disabled until there's a recording** (it was a faded
  always-tappable button — ambiguous).
- *Feeds loading:* spinners imply "wait"; skeletons imply "almost there." Swapped feed and list
  loading to skeletons that match the real content's shape, so the layout doesn't jump on load.
- *Empty moments:* every empty state now states what's missing **and offers the one action that
  fixes it** (Record a voice, New message, Go live). Emptiness should convert, not apologize.

**What deserves emphasis?** The *voice* and the *person*. We pushed avatars, names, and the player
forward (elevation, ring treatment, online presence) and pulled metadata back (consistent muted
captions, a single secondary metric — plays — right-aligned and quiet).

**What did we remove / demote?**
- Collapsed replies on the feed by default visual weight (kept functionality, lightened the card).
- Cut the dead `•••` into a real pressable with a label (still a stub action, but now honest).
- Removed the second input language — all inputs are now one bordered-white style.
- Renamed tab labels to sentence case and gave Discover a `compass` (search is an action, not a
  place — the icon now reads as "explore").

**What we intentionally kept (and why):** every route, every data call, every handler. This was a
*reskin to a system*, not a re-architecture. Live audio is still in "presence mode" (see Phase 5) —
that's a backend milestone, not a design one, so the room/call screens are designed to gracefully
hold that truth rather than fake a waveform that isn't streaming.

---

## Phase 3 — Per-screen redesign

> Format per screen: **Problems · UX · UI · Reasoning · Final.** "Final" = the shipped file.

### Onboarding (`index.tsx`)
- **Problems:** Strong already, but the hero mic used the *light* brand tint (looked unfinished) and
  the floating pills used an ad-hoc shadow.
- **UX:** Unchanged — clear single primary ("Get started") and secondary ("I already have an account").
- **UI:** Hero mic now uses solid brand blue with a real `lg` shadow so it anchors the composition;
  floating pills use the shared `shadow.md`; type moved onto the scale (`hero`, `callout`).
- **Reasoning:** The first screen sets the quality bar; depth + a confident hero make the promise feel real.
- **Final:** Shipped.

### Sign in / Sign up (`sign-in.tsx`, `sign-up.tsx`)
- **Problems:** Bare back-chevron header; inputs had no focus state; errors were loose red text.
- **UX:** Inputs now show a **focus ring** (border → brand blue) and **inline field-level errors**;
  the submit button has a real loading state instead of a relabel.
- **UI:** Standard `AppHeader` back affordance; leading field icons (`mail`, `lock`, `at-sign`);
  title/subtitle on the type scale.
- **Reasoning:** Auth is a trust moment — focus states and inline validation are table stakes for
  "real."
- **Final:** Shipped.

### Home feed (`(tabs)/home.tsx`)
- **Problems:** Flat cards; always-expanded replies; spinner load; one-line empty; rooms rail with a
  gray dashed "Yours" that didn't read as "go live."
- **UX:** Skeleton feed on load; a converting empty state; the rooms rail only renders when rooms
  exist (no empty rail), and the create affordance is now a tinted, labeled **"Go live."**
- **UI:** Cards are the elevated `Card` primitive (white, hairline border, soft `sm` shadow on
  paper); LIVE uses the shared `Badge`; the CTA banner is warm cream with `xs` elevation; metrics
  use `headphones` + quiet caption.
- **Reasoning:** The feed is the product's home base — it has to feel layered, scannable, and alive.
- **Final:** Shipped.

### Discover (`(tabs)/for-you.tsx`)
- **Problems:** "For You" as a screen title collided with the "For You" tab inside it; suggested/
  trending blocks used three different container styles; spinner load.
- **UX:** Renamed the screen to **Discover** (the tabs inside keep For You / Following / Topics);
  skeleton load; converting empties per tab.
- **UI:** Suggested and Trending are now consistent elevated `Card`s with a shared `SectionLabel`
  eyebrow; rank numerals and rows on the type scale.
- **Reasoning:** A discovery surface must feel curated and orderly; one container language does that.
- **Final:** Shipped.

### Activity (`(tabs)/activity.tsx`)
- **Problems:** All notification icons were the same blue; spinner load; one-line empty.
- **UX:** Skeleton rows on load; a real empty state.
- **UI:** Each notification type carries its **own accent** (like = coral, follow = blue, reply =
  green) in a soft tinted medallion — the row is now legible at a glance.
- **Reasoning:** Color-coding notification types is a tiny touch that massively speeds recognition.
- **Final:** Shipped.

### Profile (`(tabs)/profile.tsx`)
- **Problems:** Stats and tabs used magic sizes; empty tabs were bare text; the account menu lacked
  a Settings entry.
- **UX:** Empty *Voices* tab offers **Record a voice**; menu now includes Settings; pull-to-refresh
  retained.
- **UI:** Stats, name, bio, and tab labels on the type scale; story-ring avatar; dark "Edit profile"
  primary paired with a bordered "Share."
- **Reasoning:** A profile is a personal space — it should feel composed and offer the next action.
- **Final:** Shipped.

### Record (`record.tsx`)
- **Problems:** **Reversed** Cancel/Post header; "Post" always tappable but faded; flat record button;
  ALL-CAPS status string.
- **UX:** Header fixed to `Cancel · New voice · Post`; **Post is truly disabled** until a recording
  exists and shows a spinner while posting; status reads as friendly sentence case ("Recording",
  "Ready to post").
- **UI:** The record button turns **coral while recording** with a stop-square glyph and a real `md`
  shadow + press-scale; timer uses tabular figures so it doesn't jitter; caption input matches the
  one input language.
- **Reasoning:** This is the app's hero action — it must feel unmistakable, tactile, and forgiving.
- **Final:** Shipped.

### Live room (`room.tsx`)
- **Problems:** Hand-rolled LIVE pill; flat circular controls; ad-hoc caption card radius.
- **UX:** Controls have press-scale and `accessibilityLabel`s (Mute, Invite, Share); the "presence
  mode" copy is honest about live audio status.
- **UI:** Shared `Badge` for LIVE; the immersive deep-teal world keeps its identity but gains a
  hairline-bordered caption card and consistent `label` eyebrows and `title1` room title.
- **Reasoning:** "On air" should feel different from "browsing" — we kept the dark world and made it
  feel intentional rather than improvised.
- **Final:** Shipped.

### Call (`call.tsx`)
- **Problems:** Flat controls; magic type sizes.
- **UX:** Every control labeled for screen readers; end-call stays coral and unmistakable.
- **UI:** Controls get `md` elevation + press-scale; name/status on the scale; connection timer uses
  tabular figures.
- **Reasoning:** A call screen is glanceable and high-stakes — big targets, clear status, one red exit.
- **Final:** Shipped.

### Messages list (`messages.tsx`)
- **Problems:** Search used the cream input language; spinner load; one-line empty; the "+" used a
  plus glyph (reads "add," not "compose").
- **UX:** Skeleton rows; converting empty ("New message"); compose icon is now `edit` (pencil).
- **UI:** `AppHeader` with an elevated ink compose button; unified white-bordered search; rows on the
  type scale with primary unread treatment.
- **Reasoning:** A familiar, polished inbox pattern users already trust.
- **Final:** Shipped.

### Conversation (`conversation.tsx`)
- **Problems:** Flat bubbles; header lacked status; composer used the cream language.
- **UX:** Header shows **"Active now"** with a presence dot; call button is a tinted target.
- **UI:** Incoming bubbles are white with hairline border + `xs` shadow; outgoing are brand blue;
  asymmetric corner radii for a natural chat shape; composer matches the one input language with a
  press-scaling mic/send button that turns coral while recording.
- **Reasoning:** Messaging is a pattern people have strong expectations about — meeting them precisely
  is the polish.
- **Final:** Shipped.

### New message (`new-message.tsx`)
- **Problems:** Cream search; spinner load; one-line empty; no row press feedback.
- **UX:** Skeleton rows; real empty ("No people found"); rows highlight on press.
- **UI:** Unified search and type scale.
- **Final:** Shipped.

### Edit profile (`edit-profile.tsx`)
- **Problems:** **Reversed** Save/Cancel header.
- **UX:** Fixed to `Cancel · Edit profile · Save`; Save shows a spinner; camera badge retained.
- **UI:** Type scale on counter/username helper text.
- **Final:** Shipped.

### Create room (`create-room.tsx`)
- **Problems:** Generic mic icon for a *room* (rooms ≠ voice notes); magic spacing.
- **UX:** "Go live" shows a spinner while creating.
- **UI:** `radio` icon to distinguish rooms from voice notes; type scale; canonical spacing.
- **Final:** Shipped.

### Connections (`connections.tsx`)
- **Problems:** Hand-rolled header; spinner; one-line empties (three variants).
- **UX:** Skeleton rows; tailored empty states per context (followers / following / invite).
- **UI:** `AppHeader`; rows on the type scale. *(Note: theme `type` is aliased to `t` here to avoid
  colliding with the local `type` variable.)*
- **Final:** Shipped.

### Settings (`settings.tsx`)
- **Problems:** Flat white groups; uppercase inline section label.
- **UX:** Rows highlight on press; grouped under shared `SectionLabel`s (Notifications, Account).
- **UI:** Groups are elevated `Card`s; toggle icons sit in soft brand medallions.
- **Final:** Shipped.

---

## Phase 4 — Design system reference

Shipped in `src/theme/index.ts`. New shared primitives in `src/components/`:
`Card`, `AppHeader`, `EmptyState`, `Skeleton` (+ `FeedSkeleton`, `RowSkeleton`), `Badge`,
`SectionLabel` — plus refreshed `Button`, `Field`, `Chip`, `IconButton`, `Avatar`, `TabBar`,
`VoiceCard`, `VoicePlayer`, `Waveform`.

### Color tokens (semantic)

| Token | Value | Use |
|---|---|---|
| `bg` | `#EEF3F6` | App canvas (lighter, less saturated than before) |
| `card` / `white` | `#FFFFFF` | Surfaces |
| `cardAlt` | `#F4F8FA` | Subtle inset / skeleton fill |
| `cream` | `#FBF3E9` | Warm banners |
| `primary` | `#1573A6` | Brand; primary actions, links |
| `primarySoft` | `#EAF4FA` | Tinted icon chips, pressed/active states |
| `ink` / `text` | `#211A12` | Headings & body |
| `textSec` | `#736857` | Secondary text (AA on white) |
| `textMuted` | `#94886F` | Tertiary / large text only |
| `border` | `#E5ECF1` | Hairline borders |
| `divider` | `#EDF2F5` | Internal dividers |
| `live` | `#F2603F` | LIVE, destructive, unread |
| `green` / `warm` / `purple` | accents | Status / avatar accents |
| `pill` `onPill` `pillTrack` | ink / white | Dark voice-pill player |
| `deep*` / `onDeep*` | teal world | Rooms & calls immersive surfaces |

### Type scale (`type`)
`hero 38/44/800` · `title1 28/34/800` · `title2 22/28/700` · `title3 17/22/700` ·
`headline 16/21/700` · `body 16/23/400` · `bodyStrong 16/23/600` · `callout 15/20/500` ·
`subhead 14/20/500` · `footnote 13/18/400` · `caption 12/16/500` · `label 12/16/700 +1 tracking`.
Swap one token (`fontFamily`) to a loaded font (e.g. Inter) to upgrade all type at once.

### Spacing (4-pt grid)
`xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · xxxl 32 · huge 40`, plus `gutter 20` (canonical
screen edge padding).

### Radius
`xs 8 · sm 10 · md 12 · lg 16 · xl 20 (default card) · xxl 28 · pill 999`.

### Elevation (`shadow`) — quiet, blue-tinted (`#143B52`)
`xs` (1pt, ambient) · `sm` (cards) · `md` (raised buttons, modals) · `lg` (tab bar, hero).
Each token sets iOS shadow props + Android `elevation` together.

### Sizing (`size`)
icons `14/16/18/20/24` · control heights `36/44/52` · min hit target `44` · header `56` ·
avatars `30/36/44/52/68/88`.

### Motion (`motion`)
`fast 120 · base 200 · slow 320`; standard press feedback = scale **0.97** + opacity **0.9**.
*Described animations (to implement with Reanimated):* feed cards fade-up 8px on mount (stagger 30ms);
record button pulses subtly while recording; tab icon scales 1→1.08 on focus; skeleton cross-fades to
content; bubbles spring in from the sender's side.

### Component contracts (quick reference)
- **Button** — `primary | secondary | danger | dark | ghost`; `loading`, `disabled`, `icon`, `fill`;
  press-scale; elevated variants get `sm` shadow.
- **Field** — label + optional leading icon, focus ring, inline `error`/`hint`.
- **Card** — white, `radius.xl`, hairline border, `elevation` prop (`none|xs|sm|md`); pressable variant.
- **AppHeader** — `large | inline`, optional `onBack`, `right` actions, `leading` slot. One header
  for every screen.
- **EmptyState** — icon medallion + title + subtitle + optional single CTA.
- **Badge** — `live | primary | neutral | count`, optional dot.
- **Avatar** — story-ring with white gap, optional `online` presence dot.

### Accessibility rules
Body/secondary text meets AA on white; `textMuted` is reserved for large or non-essential text.
Every icon-only control has an `accessibilityLabel`. Touch targets ≥ 44pt. Status is never encoded by
color alone (LIVE has a dot + text; presence has a dot + "Active now").

---

## Phase 5 — Production quality & known gaps

- **Functionality preserved.** Every route, data call, and handler is intact; this was a reskin to a
  system. All files pass a syntax/JSX parse and every theme token referenced resolves.
- **Run `npm install` then `npx expo start`** to preview — the redesign touches presentation only.
- **Live audio is still "presence mode."** Rooms and calls show who's present but don't yet stream
  audio. The screens are honest about this rather than faking it. Wiring real-time audio (WebRTC /
  LiveKit) is the next milestone — see the note to your collaborator.
- **Font upgrade is one line.** Load Inter (or SF/General Sans) via `expo-font` and set `fontFamily`
  in the theme to lift all typography to "premium" in a single change.
- **Optional next passes:** add Reanimated entrance animations (described above); haptics on
  record/send/like; a real `•••` action sheet; dark mode (the token structure already supports it —
  add a second semantic map).

---

## Master Claude Design prompt

> Paste this to recreate the entire redesigned app from scratch.

```
Build "Naizz," a voice-first social app in React Native (Expo Router, TypeScript). Every post is a
voice recording. Features: voice feed with voice replies, live audio rooms, 1:1 calls, voice DMs,
profiles. Implement it to feel like a shipping product (Linear / Airbnb / Stripe polish), not a
prototype.

DESIGN LANGUAGE — "Studio"
- One confident brand blue (#1573A6). Color is sparing and always meaningful.
- Light layered surfaces: a soft cool-paper canvas (#EEF3F6) with white cards that lift off it using
  quiet, blue-tinted shadows (#143B52). Real elevation everywhere — never flat cards on flat bg.
- A separate immersive deep-teal world (#16384A) for live rooms and calls, so "on air" feels
  different from "browsing."
- A signature dark "voice pill" player (ink bg, blue play button, animated waveform, duration) reused
  across feed, replies, DMs, and trending.

DESIGN TOKENS (single source of truth, in src/theme)
- Type scale only — no magic sizes: hero 38/44/800, title1 28/34/800, title2 22/28/700,
  title3 17/22/700, headline 16/21/700, body 16/23/400, callout 15/20/500, subhead 14/20/500,
  footnote 13/18/400, caption 12/16/500, label 12/16/700 (+1 tracking, uppercase).
- 4-pt spacing (4/8/12/16/20/24/32/40), screen gutter 20.
- Radius: xs8 sm10 md12 lg16 xl20(card) xxl28 pill999.
- Shadows xs/sm/md/lg (iOS shadow props + Android elevation), blue-tinted, subtle.
- Colors: bg #EEF3F6, card #FFF, cardAlt #F4F8FA, cream #FBF3E9, primary #1573A6,
  primarySoft #EAF4FA, ink #211A12, textSec #736857, textMuted #94886F (large text only),
  border #E5ECF1, divider #EDF2F5, live/coral #F2603F, green #1FA97D; deep-teal set for rooms/calls.

COMPONENT LIBRARY (build these first, use everywhere)
Button (primary/secondary/danger/dark/ghost, loading, disabled, icon, press-scale 0.97 + sm shadow),
Field (label + leading icon + focus ring + inline error), Card (white, xl radius, hairline border,
elevation prop), AppHeader (large/inline, back, right actions — ONE header for every screen),
EmptyState (icon medallion + title + subtitle + single CTA), Skeleton/FeedSkeleton/RowSkeleton
(shimmer, shaped like real content), Badge (live/primary/neutral/count + dot), SectionLabel (eyebrow),
Avatar (story-ring with white gap + online dot), TabBar (sentence-case labels, active pill behind
icon, raised center mic with md shadow + press-scale), VoicePlayer, Waveform (organic, rounded caps).

INTERACTION RULES
- Loading = skeletons that match content shape (never bare spinners on primary surfaces).
- Empty states always name what's missing AND offer the one action that fixes it.
- All press targets ≥44pt, scale 0.97 on press; icon-only controls have accessibilityLabel.
- Modal headers follow Cancel · Title · Primary; primary action is disabled until valid, shows a
  spinner while working.
- Status never by color alone (LIVE = dot + text; presence = dot + "Active now").

SCREENS
Onboarding (hero mic + floating voice pills), Sign in/up (focus rings, inline errors), Home feed
(rooms rail, cream CTA banner, elevated voice cards with player + likes/replies/plays), Discover
(For You / Following / Topics tabs, chips, suggested + trending cards), Activity (per-type colored
notification medallions), Profile (ring avatar, stats, tabs: Voices/Liked/About), Record (Cancel ·
New voice · Post; big tactile mic that turns coral while recording, tabular timer, caption + chips),
Live room (deep-teal, LIVE badge, speakers grid, captions card, circular controls, Leave), Call
(deep-teal, big avatar, labeled controls, red end), Messages (inbox with skeletons + compose),
Conversation ("Active now" header, blue/white bubbles, voice + text composer), New message, Edit
profile (Cancel · Edit profile · Save), Create room, Connections, Settings (grouped elevated cards).

ACCESSIBILITY: AA contrast for all meaningful text; reserve the lightest text for large/non-essential
only. Preserve all functionality; improve usability before aesthetics; keep every screen consistent
with the token system above. Make it feel fast, layered, and intentional.
```

---

*Both deliverables are in the repo: this document, and the redesigned `src/theme`, `src/components`,
and `src/app` files. Run `npm install && npx expo start` to see it live.*
