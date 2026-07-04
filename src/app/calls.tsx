import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/theme';
import { useAuth } from '@/lib/auth';
import { listFollowing } from '@/lib/social';
import { placeCall } from '@/lib/calls';
import type { Connection } from '@/lib/types';

export default function Calls() {
  const router = useRouter();
  const { user } = useAuth();
  const [people, setPeople] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setPeople(await listFollowing(user.id));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const call = async (c: Connection) => {
    try {
      const callId = await placeCall(c.id);
      router.push({ pathname: '/call', params: { room: callId, callId, name: c.displayName, seed: c.username, outgoing: '1' } });
    } catch (e) {
      Alert.alert('Could not start call', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ height: 56, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 6 }}>
          <Feather name="chevron-left" size={26} color={colors.ink} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>Calls</Text>
      </View>
      <Text style={{ paddingHorizontal: 16, paddingBottom: 8, fontSize: 13.5, color: colors.textSec }}>
        Call someone you follow — their phone rings and they can pick up or decline.
      </Text>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
              <Avatar seed={item.username} name={item.displayName} size={48} imageUrl={item.avatarUrl} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{item.displayName}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>@{item.username}</Text>
              </View>
              <Pressable
                onPress={() => call(item)}
                style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name="phone" size={20} color={colors.white} />
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 76 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', lineHeight: 20 }}>
                Follow some people first — you can call anyone you follow.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
