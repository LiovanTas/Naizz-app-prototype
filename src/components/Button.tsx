import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'dark';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Feather.glyphMap;
  height?: number;
  radiusOverride?: number;
  fontSize?: number;
  fill?: boolean; // stretch to container width
  color?: string; // text/icon color override (secondary)
  style?: ViewStyle;
};

// Padded pill button. Generous horizontal padding so labels (and the pressed
// ripple) never feel packed in.
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  height = 52,
  radiusOverride,
  fontSize = 16,
  fill,
  color,
  style,
}: Props) {
  const secondary = variant === 'secondary';
  const bg = secondary
    ? colors.white
    : variant === 'danger'
      ? colors.live
      : variant === 'dark'
        ? colors.ink
        : colors.primary;
  const fg = secondary ? color ?? colors.text : colors.white;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          borderRadius: radiusOverride ?? radius.lg,
          backgroundColor: bg,
          borderWidth: secondary ? 1.5 : 0,
          borderColor: colors.border,
          alignSelf: fill ? 'stretch' : 'flex-start',
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
      <Text style={{ color: fg, fontSize, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
