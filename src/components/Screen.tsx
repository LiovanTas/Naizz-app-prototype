import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

type Props = {
  children: ReactNode;
  background?: string;
  edges?: Edge[];
  style?: ViewStyle;
};

// Safe-area screen container.
export function Screen({ children, background = colors.bg, edges = ['top'], style }: Props) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background }}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </SafeAreaView>
  );
}
