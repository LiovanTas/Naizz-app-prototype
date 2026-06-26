import { Text, TextStyle } from 'react-native';
import { colors, type } from '@/theme';

// The standardized eyebrow / section header used above grouped content.
export function SectionLabel({ children, color = colors.textMuted, style }: { children: string; color?: string; style?: TextStyle }) {
  return <Text style={[type.label, { color, textTransform: 'uppercase' }, style]}>{children}</Text>;
}
