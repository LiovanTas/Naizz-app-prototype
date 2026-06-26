import { ReactNode } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, size, type, spacing } from '@/theme';

type Props = {
  title?: string;
  /** 'large' = big screen title (home, feeds). 'inline' = centered nav title. */
  variant?: 'large' | 'inline';
  onBack?: () => void;
  /** Right-aligned actions (IconButtons, buttons). */
  right?: ReactNode;
  /** Optional element rendered under the title (e.g. avatar in nav title). */
  leading?: ReactNode;
  style?: ViewStyle;
};

// One header to rule them all. Consistent 56pt bar, consistent paddings,
// consistent back affordance, consistent type.
export function AppHeader({ title, variant = 'large', onBack, right, leading, style }: Props) {
  return (
    <View
      style={[
        {
          minHeight: size.header,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Feather name="chevron-left" size={26} color={colors.ink} />
        </Pressable>
      ) : null}

      {leading}

      {title ? (
        <Text
          numberOfLines={1}
          style={[
            variant === 'large' ? type.title1 : type.title3,
            {
              color: colors.ink,
              flex: 1,
              textAlign: variant === 'inline' && !onBack ? 'center' : 'left',
              marginLeft: variant === 'inline' && onBack ? -8 : 0,
            },
          ]}
        >
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {right ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>{right}</View> : null}
    </View>
  );
}
