// Naizz design tokens — palette from the v2 screen designs.
// Warm, cozy take: soft ice-blue canvas, deep brand blue, warm-neutral text,
// dark "voice pill" surfaces, coral for live/leave, deep teal for immersive.

export const colors = {
  bg: '#DCEDF3', // soft ice-blue page background
  white: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F4FAFB', // very light surface
  cream: '#F8EDE0', // warm banner / inputs / search

  primary: '#1573A6', // brand blue (logo, links, primary buttons)
  primaryLight: '#3E92C4',
  primaryDeep: '#125F8A',

  ink: '#2A2118', // warm near-black: headings, dark CTA, voice pills
  text: '#2A2118',
  textSec: '#6F6354', // warm grey
  textMuted: '#A4937D', // taupe
  border: '#D5E3EA',
  divider: '#E3EDF1',

  // avatar / status accents
  green: '#2FBF8F',
  warm: '#F2A03F',
  purple: '#9B6DD6',
  live: '#F2603F', // LIVE pill, leave/end, unread

  // dark voice-pill surface
  pill: '#2A2118',
  onPill: '#FFFFFF',
  pillTrack: 'rgba(255,255,255,0.32)',

  // immersive (room / call) surfaces
  deep: '#16384A',
  deepCard: '#1E4A60',
  deepBtn: '#244F66',
  onDeep: '#FFFFFF',
  onDeepSoft: '#9DB6C4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  pill: 999,
} as const;

export const font = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Deterministic avatar color per seed (username/id).
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

// Initials from a display name ("Maya Chen" -> "MC").
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
