import { ReactNode } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  padding?: number;
  elevation?: 'none' | 'xs' | 'sm' | 'md';
  style?: ViewStyle;
};

// The canonical surface. White, rounded, gently lifted off the canvas.
export function Card({ children, onPress, padding = spacing.lg, elevation = 'sm', style }: Props) {
  const base: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding,
    borderWidth: 1,
    borderColor: colors.border,
    ...(elevation === 'none' ? {} : shadow[elevation]),
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.96 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
