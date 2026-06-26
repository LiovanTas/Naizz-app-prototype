import { View, Text } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Tone = 'live' | 'primary' | 'neutral' | 'count';

// Small status pill. LIVE indicators, counts, labels — one component.
export function Badge({ label, tone = 'neutral', dot }: { label: string; tone?: Tone; dot?: boolean }) {
  const bg =
    tone === 'live' ? colors.live : tone === 'primary' ? colors.primary : tone === 'count' ? colors.primary : colors.cardAlt;
  const fg = tone === 'neutral' ? colors.textSec : colors.white;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        minWidth: tone === 'count' ? 20 : undefined,
        justifyContent: 'center',
      }}
    >
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white }} /> : null}
      <Text style={{ fontSize: tone === 'count' ? 11 : 10, fontWeight: '800', color: fg, letterSpacing: tone === 'count' ? 0 : 0.6 }}>
        {label}
      </Text>
    </View>
  );
}
