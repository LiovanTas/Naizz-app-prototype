import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors, radius } from '@/theme';

type Props = TextInputProps & { label: string };

export function Field({ label, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSec }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSec}
        style={[
          {
            backgroundColor: colors.white,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 14,
            fontSize: 15,
            color: colors.text,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}
