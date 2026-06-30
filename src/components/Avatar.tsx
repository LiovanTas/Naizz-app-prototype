import { View, Text, Image } from 'react-native';
import { avatarColor, initials, colors, USE_GENERATED_AVATARS, generatedAvatarUrl } from '@/theme';

type Props = {
  seed: string; // determines the fallback color
  name?: string; // initials shown inside (falls back to seed)
  size?: number;
  ring?: string | null;
  imageUrl?: string | null; // uploaded profile picture
  online?: boolean; // presence dot
};

// Circle avatar: uploaded picture when present, else colored initials.
// `ring` draws a haloed story-style ring with a white gap.
export function Avatar({ seed, name, size = 44, ring = null, imageUrl, online }: Props) {
  const gap = ring ? 3 : 0;
  const inner = size - gap * 2 - (ring ? 3 : 0);
  // Real uploaded photo wins; otherwise a deterministic illustrated face (prototype).
  const photo = imageUrl ?? (USE_GENERATED_AVATARS ? generatedAvatarUrl(seed, inner * 2) : null);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring ?? 'transparent',
        backgroundColor: ring ? colors.white : 'transparent',
      }}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: colors.cardAlt, borderWidth: ring ? 0 : 1, borderColor: 'rgba(20,59,82,0.06)' }}
        />
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
      {online ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: Math.max(10, size * 0.26),
            height: Math.max(10, size * 0.26),
            borderRadius: 999,
            backgroundColor: colors.green,
            borderWidth: 2,
            borderColor: colors.white,
          }}
        />
      ) : null}
    </View>
  );
}
