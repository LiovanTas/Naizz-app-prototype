import { View } from 'react-native';
import { colors } from '@/theme';

// Deterministic pseudo-random bar heights (0..1), stable per length.
function waveformBars(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = Math.abs(Math.sin(i * 0.9) * 0.6 + Math.sin(i * 0.37) * 0.4);
    out.push(Math.max(0.12, v));
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
            height: Math.max(4, Math.round(h * max)),
            borderRadius: 2,
            backgroundColor: i < played ? color : trackColor,
          }}
        />
      ))}
    </View>
  );
}
