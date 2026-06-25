import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { colors } from '@/theme';
import { useAuth } from '@/lib/auth';
import { listFollowers, listFollowing, toggleFollow } from '@/lib/social';
import { sendRoomInvite } from '@/lib/messages';
import type { Connection } from '@/lib/types';

function Row({
  item,
  mode,
  onCall,
  onInvite,
}: {
  item: Connection;
  mode: 'list' | 'invite';
  onCall: (c: Connection) => void;
  onInvite: (c: Connection) => void;
}) {
  const [following, setFollowing] = useState(item.isFollowing);
  const [busy, setBusy] = useState(false);
  const [invited, setInvited] = useState(false);

  const onFollow = async () => {
    if (busy) return;
    setBusy(true);
    const was = following;
    setFollowing(!was);
    try {
      await toggleFollow(item.id, was);
    } catch {
      setFollowing(was);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
      <Avatar seed={item.username} name={item.displayName} size={48} imageUrl={item.avatarUrl} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{item.displayName}</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>@{item.username}</Text>
      </View>
      {mode === 'invite' ? (
        <Button
          label={invited ? 'Invited' : 'Invite'}
          variant={invited ? 'secondary' : 'primary'}
          height={36}
          radiusOverride={18}
          fontSize={14}
          onPress={() => {
            if (invited) return;
            setInvited(true);
            onInvite(item);
          }}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {following ? (
            <Pressable
              onPress={() => onCall(item)}
              hitSlop={6}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="phone" size={18} color={colors.primary} />
            </Pressable>
          ) : null}
          <Button
            label={following ? 'Following' : 'Follow'}
            variant={following ? 'secondary' : 'primary'}
            height={36}
            radiusOverride={18}
            fontSize={14}
            onPress={onFollow}
          />
        </View>
      )}
    </View>
  );
}

export default function Connections() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ userId?: string; type?: string; mode?: string; roomId?: string }>();
  const type = params.type === 'followers' ? 'followers' : 'following';
  const mode = params.mode === 'invite' ? 'invite' : 'list';
  const targetId = !params.userId || params.userId === 'me' ? user?.id : params.userId;

  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!targetId) return;
    try {
      const data = mode === 'invite' ? await listFollowing(targetId) : type === 'followers' ? await listFollowers(targetId) : await listFollowing(targetId);
      setItems(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [targetId, type, mode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onCall = (c: Connection) => {
    router.push({ pathname: '/call', params: { peer: c.id, name: c.displayName, seed: c.username } });
  };

  const onInvite = (c: Connection) => {
    if (!params.roomId) return;
    sendRoomInvite(c.id, params.roomId).catch(() => Alert.alert('Could not invite'));
  };

  const title = mode === 'invite' ? 'Invite to room' : type === 'followers' ? 'Followers' : 'Following';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ height: 56, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 6 }}>
          <Feather name="chevron-left" size={26} color={colors.ink} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{title}</Text>
      </View>
      {mode === 'invite' ? (
        <Text style={{ paddingHorizontal: 16, paddingBottom: 6, fontSize: 13, color: colors.textSec }}>
          Tap Invite to send a join link to people you follow.
        </Text>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <Row item={item} mode={mode} onCall={onCall} onInvite={onInvite} />}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 76 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', lineHeight: 20 }}>
                {mode === 'invite'
                  ? 'Follow some people first, then invite them here.'
                  : type === 'followers'
                    ? 'No followers yet.'
                    : 'Not following anyone yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
