// Naizz Design System — "Studio"
// A warm, voice-first design language.
//
// Principles
// • One confident brand blue. Color is used sparingly and always means something.
// • Light, layered surfaces. White cards lift off a soft cool-paper canvas with
//   real (but quiet) elevation — the app should feel like physical paper, not a
//   wireframe.
// • An immersive deep world for live audio (rooms & calls) so "you are on air"
//   feels different from "you are browsing".
// • A strict 4-pt spatial grid, a single type scale, and a small radius set.
//   Nothing is a magic number.

import { TextStyle, ViewStyle, Platform } from 'react-native';

/* ------------------------------------------------------------------ *
 * 1. PALETTE  (raw values — prefer the semantic `colors` below)
 * ------------------------------------------------------------------ */
const palette = {
  // Brand blue ramp
  blue50: '#EAF4FA',
  blue100: '#D6E9F3',
  blue200: '#AED4E8',
  blue300: '#7BB8D9',
  blue400: '#3E92C4',
  blue500: '#1573A6', // brand
  blue600: '#125F8A',
  blue700: '#0E4A6C',

  // Warm neutral ink ramp
  ink900: '#211A12', // headings / darkest
  ink800: '#2A2118',
  ink600: '#5C5346',
  ink500: '#736857',
  ink400: '#94886F',
  ink300: '#B6AB97',

  // Cool paper / surfaces
  paper: '#EEF3F6', // app canvas
  paperWarm: '#FBF3E9', // warm input / banner surface
  surface: '#FFFFFF',
  surfaceAlt: '#F4F8FA',
  line: '#E5ECF1', // hairline borders
  lineSoft: '#EDF2F5', // dividers

  white: '#FFFFFF',

  // Accents (status)
  green: '#1FA97D',
  amber: '#E8923B',
  violet: '#8B63CE',
  coral: '#F2603F', // live / destructive / unread

  // Immersive (rooms & calls)
  deep900: '#11303F',
  deep800: '#16384A',
  deep700: '#1E4A60',
  deep600: '#27566E',
  deepLine: 'rgba(255,255,255,0.10)',
} as const;

/* ------------------------------------------------------------------ *
 * 2. SEMANTIC COLORS  (every legacy key preserved + refined)
 * ------------------------------------------------------------------ */
export const colors = {
  // canvas & surfaces
  bg: palette.paper,
  white: palette.white,
  card: palette.surface,
  cardAlt: palette.surfaceAlt,
  cream: palette.paperWarm,

  // brand
  primary: palette.blue500,
  primaryLight: palette.blue400,
  primaryDeep: palette.blue600,
  primarySoft: palette.blue50, // tinted fill for icon chips / pressed states

  // text
  ink: palette.ink900,
  text: palette.ink900,
  textSec: palette.ink500,
  textMuted: palette.ink400,

  // structure
  border: palette.line,
  divider: palette.lineSoft,

  // status accents
  green: palette.green,
  warm: palette.amber,
  purple: palette.violet,
  live: palette.coral,
  liveSoft: '#FCE7E1',

  // dark "voice pill" surface
  pill: palette.ink900,
  onPill: palette.white,
  pillTrack: 'rgba(255,255,255,0.26)',

  // immersive (room / call) surfaces
  deep: palette.deep800,
  deepCard: palette.deep700,
  deepBtn: palette.deep600,
  deepLine: palette.deepLine,
  onDeep: palette.white,
  onDeepSoft: '#9DB6C4',
} as const;

/* ------------------------------------------------------------------ *
 * 3. SPACING  (4-pt grid)
 * ------------------------------------------------------------------ */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  // canonical screen gutter
  gutter: 20,
} as const;

/* ------------------------------------------------------------------ *
 * 4. RADIUS
 * ------------------------------------------------------------------ */
export const radius = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20, // default card
  xxl: 28,
  pill: 999,
} as const;

/* ------------------------------------------------------------------ *
 * 5. TYPOGRAPHY
 * One scale. Swap `fontFamily` to a loaded font (e.g. Inter) to upgrade
 * everything at once.
 * ------------------------------------------------------------------ */
export const fontFamily: TextStyle['fontFamily'] = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: undefined,
});

export const font = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

type TypePreset = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'
>;

export const type: Record<
  | 'hero'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'label',
  TypePreset
> = {
  hero: { fontSize: 38, lineHeight: 44, fontWeight: '800', letterSpacing: -0.6 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  title3: { fontSize: 17, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
  headline: { fontSize: 16, lineHeight: 21, fontWeight: '700', letterSpacing: -0.1 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1 },
};

/* ------------------------------------------------------------------ *
 * 6. ELEVATION  (quiet, blue-tinted shadows so white lifts off paper)
 * ------------------------------------------------------------------ */
const SHADOW_TINT = '#143B52';
function makeShadow(opacity: number, radiusPx: number, y: number, elevation: number): ViewStyle {
  return {
    shadowColor: SHADOW_TINT,
    shadowOpacity: opacity,
    shadowRadius: radiusPx,
    shadowOffset: { width: 0, height: y },
    elevation,
  };
}
export const shadow = {
  none: { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 } as ViewStyle,
  xs: makeShadow(0.05, 4, 1, 1),
  sm: makeShadow(0.07, 10, 3, 2),
  md: makeShadow(0.1, 18, 8, 5),
  lg: makeShadow(0.14, 30, 16, 10),
} as const;

/* ------------------------------------------------------------------ *
 * 7. SIZING  (icons, controls, avatars, hit targets)
 * ------------------------------------------------------------------ */
export const size = {
  icon: { xs: 14, sm: 16, md: 18, lg: 20, xl: 24 },
  control: { sm: 36, md: 44, lg: 52 }, // button / input heights
  hit: 44, // minimum touch target
  header: 56,
  avatar: { xs: 30, sm: 36, md: 44, lg: 52, xl: 68, xxl: 88 },
} as const;

/* ------------------------------------------------------------------ *
 * 8. MOTION  (durations + easing names, for documentation/use)
 * ------------------------------------------------------------------ */
export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  // press feedback
  pressScale: 0.97,
  pressOpacity: 0.9,
} as const;

/* ------------------------------------------------------------------ *
 * 9. AVATAR HELPERS  (unchanged API)
 * ------------------------------------------------------------------ */
const avatarColors = [
  colors.primaryLight,
  colors.green,
  colors.warm,
  colors.purple,
  colors.live,
  colors.primary,
];
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarColors[h % avatarColors.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ *
 * 10. GENERATED AVATARS  (PROTOTYPE)
 * Until real profile photos are seeded in the backend, render a distinct
 * illustrated face per user so the app feels populated like a network.
 * Flip USE_GENERATED_AVATARS to false to fall back to colored initials.
 * Source: DiceBear HTTP API (free, served over CDN).
 * ------------------------------------------------------------------ */
export const USE_GENERATED_AVATARS = true;

const DICEBEAR_STYLE = 'adventurer';
const DICEBEAR_BG = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';

export function generatedAvatarUrl(seed: string, size = 96): string {
  const s = encodeURIComponent(seed || 'naizz');
  const px = Math.max(48, Math.round(size));
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/png?seed=${s}&size=${px}&backgroundColor=${DICEBEAR_BG}`;
}
