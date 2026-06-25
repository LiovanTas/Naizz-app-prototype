import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme';

type Props = {
  name: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  size?: number; // touch target box
  icon?: number; // glyph size
  color?: string;
  background?: string;
};

export function IconButton({ name, onPress, size = 40, icon = 22, color = colors.text, background }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: background ?? 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Feather name={name} size={icon} color={color} />
    </Pressable>
  );
}
