import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '@/theme';
import { Button } from './Button';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

// A real empty state: a soft icon medallion, a confident title, a calm
// subtitle, and (optionally) the one action that fixes the emptiness.
export function EmptyState({ icon, title, subtitle, actionLabel, onAction, compact }: Props) {
  return (
    <View style={{ alignItems: 'center', paddingTop: compact ? spacing.xxxl : 64, paddingHorizontal: spacing.xxl }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.xxl,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[type.title3, { color: colors.ink, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[type.subhead, { color: colors.textSec, textAlign: 'center', marginTop: spacing.xs, maxWidth: 300 }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} height={44} style={{ marginTop: spacing.xl }} />
      ) : null}
    </View>
  );
}
