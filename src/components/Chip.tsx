import { Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, motion } from '@/theme';

type Props = {
  label: string;
  active?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
};

// Filter / selection chip. Selected = solid ink, resting = bordered white.
export function Chip({ label, active, icon, onPress }: Props) {
  const fg = active ? colors.white : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.ink : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
        opacity: pressed ? motion.pressOpacity : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {icon ? <Feather name={icon} size={15} color={active ? colors.white : colors.primary} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: fg, fontSize: 13.5, fontWeight: '600', letterSpacing: -0.1 }}>{label}</Text>
    </Pressable>
  );
}
