import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { colors, radius } from '@/theme';
import { supabase } from '@/lib/supabase';
import { getOrCreateDM } from '@/lib/messages';

type U = { id: string; username: string; display_name: string };

export default function NewMessage() {
  const router = useRouter();
  const [users, setUsers] = useState<U[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('id,username,display_name')
        .neq('id', user?.id ?? '')
        .order('display_name')
        .limit(100);
      setUsers((data ?? []) as U[]);
      setLoading(false);
    })();
  }, []);

  const open = async (u: U) => {
    try {
      const id = await getOrCreateDM(u.id);
      router.replace({ pathname: '/conversation', params: { id, name: u.display_name, seed: u.username } });
    } catch (e) {
      Alert.alert('Could not open chat', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.display_name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: colors.textSec }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>New message</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.md, paddingHorizontal: 14 }}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: colors.ink }}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
              <Avatar seed={item.username} name={item.display_name} size={48} />
              <View>
                <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{item.display_name}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>@{item.username}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50, color: colors.textSec }}>No people found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
