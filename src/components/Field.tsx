import { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '@/theme';

type Props = TextInputProps & {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  hint?: string;
};

export function Field({ label, icon, error, hint, style, multiline, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.live : focused ? colors.primary : colors.border;

  return (
    <View style={{ gap: spacing.xs + 2 }}>
      {label ? <Text style={[type.subhead, { color: colors.textSec, fontWeight: '600' }]}>{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor,
          borderRadius: radius.md,
          paddingHorizontal: 14,
        }}
      >
        {icon ? <Feather name={icon} size={18} color={focused ? colors.primary : colors.textMuted} style={{ marginRight: 10, marginTop: multiline ? 14 : 0 }} /> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          style={[
            { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
            style,
          ]}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={[type.caption, { color: colors.live }]}>{error}</Text>
      ) : hint ? (
        <Text style={[type.caption, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}
