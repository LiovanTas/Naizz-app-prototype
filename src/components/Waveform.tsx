import { View } from 'react-native';
import { colors } from '@/theme';

// Deterministic, organic-looking bar heights (0..1), stable per length.
// Layered sines + a gentle center-weighted envelope so it reads like real audio.
function waveformBars(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const base = Math.abs(Math.sin(i * 0.9) * 0.5 + Math.sin(i * 0.37) * 0.3 + Math.sin(i * 1.7) * 0.2);
    const t = i / Math.max(1, n - 1);
    const envelope = 0.55 + 0.45 * Math.sin(Math.PI * t); // taller in the middle
    out.push(Math.max(0.16, Math.min(1, base * envelope)));
  }
  return out;
}

type Props = {
  bars?: number;
  max?: number;
  barWidth?: number;
  gap?: number;
  played?: number; // number of bars rendered in the "played" color
  color?: string;
  trackColor?: string;
};

export function Waveform({
  bars = 30,
  max = 24,
  barWidth = 3,
  gap = 3,
  played = 12,
  color = colors.primary,
  trackColor = colors.border,
}: Props) {
  const heights = waveformBars(bars);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: barWidth,
            marginRight: i === bars - 1 ? 0 : gap,
            height: Math.max(3, Math.round(h * max)),
            borderRadius: barWidth / 2,
            backgroundColor: i < played ? color : trackColor,
          }}
        />
      ))}
    </View>
  );
}
