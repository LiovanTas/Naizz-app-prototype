import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadow, motion, size } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'dark' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Feather.glyphMap;
  height?: number;
  radiusOverride?: number;
  fontSize?: number;
  fill?: boolean; // stretch to container width
  color?: string; // text/icon color override (secondary/ghost)
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

// Padded pill button with tactile press feedback.
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  height = size.control.lg,
  radiusOverride,
  fontSize = 16,
  fill,
  color,
  loading,
  disabled,
  style,
}: Props) {
  const secondary = variant === 'secondary';
  const ghost = variant === 'ghost';
  const bg = secondary
    ? colors.white
    : ghost
      ? 'transparent'
      : variant === 'danger'
        ? colors.live
        : variant === 'dark'
          ? colors.ink
          : colors.primary;
  const fg = secondary || ghost ? color ?? (ghost ? colors.primary : colors.text) : colors.white;
  const elevated = variant === 'primary' || variant === 'dark' || variant === 'danger';
  const isOff = disabled || loading;

  return (
    <Pressable
      onPress={isOff ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isOff, busy: !!loading }}
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
          opacity: isOff ? 0.45 : pressed ? motion.pressOpacity : 1,
          transform: [{ scale: pressed && !isOff ? motion.pressScale : 1 }],
          ...(elevated && !isOff ? shadow.sm : null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} style={{ marginRight: 8 }} />
      ) : icon ? (
        <Feather name={icon} size={18} color={fg} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={{ color: fg, fontSize, fontWeight: '600', letterSpacing: -0.1 }}>{label}</Text>
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
