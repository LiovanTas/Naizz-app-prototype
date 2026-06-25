import { Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '@/theme';

type Props = {
  label: string;
  active?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
};

export function Chip({ label, active, icon, onPress }: Props) {
  const fg = active ? colors.white : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.ink : colors.white,
        borderWidth: active ? 0 : 1.5,
        borderColor: colors.border,
      }}
    >
      {icon ? <Feather name={icon} size={16} color={active ? colors.white : colors.primary} style={{ marginRight: 7 }} /> : null}
      <Text style={{ color: fg, fontSize: 13.5, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
