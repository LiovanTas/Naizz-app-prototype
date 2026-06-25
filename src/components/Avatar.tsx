import { View, Text, Image } from 'react-native';
import { avatarColor, initials } from '@/theme';

type Props = {
  seed: string; // determines the fallback color
  name?: string; // initials shown inside (falls back to seed)
  size?: number;
  ring?: string | null;
  imageUrl?: string | null; // uploaded profile picture
};

// Circle avatar: shows the uploaded picture when present, else colored initials.
export function Avatar({ seed, name, size = 44, ring = null, imageUrl }: Props) {
  const inner = ring ? size - 8 : size;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2.5 : 0,
        borderColor: ring ?? 'transparent',
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      ) : (
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: avatarColor(seed),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: Math.round(inner * 0.4) }}>
            {initials(name ?? seed)}
          </Text>
        </View>
      )}
    </View>
  );
}
