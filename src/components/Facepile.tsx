import { View, Text } from 'react-native';
import { colors, type } from '@/theme';
import { Avatar } from './Avatar';

export type Face = { seed: string; name?: string; imageUrl?: string | null };

type Props = {
  faces: Face[];
  size?: number;
  max?: number;
  extra?: number; // "+N" count beyond the shown faces
  label?: string;
  labelColor?: string;
};

// Overlapping mini-avatars + optional "+N" + label. The visual shorthand for
// "real people are here" — the strongest, cheapest signal of a live network.
export function Facepile({ faces, size = 22, max = 3, extra = 0, label, labelColor = colors.textSec }: Props) {
  const shown = faces.slice(0, max);
  const overlap = Math.round(size * 0.38);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row' }}>
        {shown.map((f, i) => (
          <View
            key={`${f.seed}-${i}`}
            style={{
              marginLeft: i === 0 ? 0 : -overlap,
              borderRadius: (size + 4) / 2,
              backgroundColor: colors.card,
              padding: 1.5,
              zIndex: shown.length - i,
            }}
          >
            <Avatar seed={f.seed} name={f.name} size={size} imageUrl={f.imageUrl} />
          </View>
        ))}
        {extra > 0 ? (
          <View
            style={{
              marginLeft: -overlap,
              width: size + 3,
              height: size + 3,
              borderRadius: (size + 3) / 2,
              backgroundColor: colors.cardAlt,
              borderWidth: 1.5,
              borderColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: colors.textSec }}>+{extra > 99 ? '99' : extra}</Text>
          </View>
        ) : null}
      </View>
      {label ? (
        <Text numberOfLines={1} style={[type.caption, { color: labelColor, marginLeft: 8, flexShrink: 1 }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
