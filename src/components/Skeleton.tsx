import { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme';

// A single shimmering placeholder block.
export function Skeleton({ width, height, radius: r = radius.sm, style }: { width?: number | string; height: number; radius?: number; style?: ViewStyle }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        { width: width as ViewStyle['width'], height, borderRadius: r, backgroundColor: colors.cardAlt, opacity: pulse },
        style,
      ]}
    />
  );
}

// Skeleton matching a VoiceCard, used while the feed loads.
function CardSkeleton() {
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Skeleton width={44} height={44} radius={22} />
        <View style={{ gap: 6 }}>
          <Skeleton width={130} height={13} />
          <Skeleton width={90} height={11} />
        </View>
      </View>
      <Skeleton width="70%" height={14} />
      <Skeleton width="100%" height={48} radius={radius.pill} />
    </View>
  );
}

// Drop-in loading list for feeds.
export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.lg, gap: spacing.lg }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

// Loading list for row-based screens (messages, people).
export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
          <Skeleton width={52} height={52} radius={26} />
          <View style={{ gap: 7, flex: 1 }}>
            <Skeleton width="45%" height={13} />
            <Skeleton width="70%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}
