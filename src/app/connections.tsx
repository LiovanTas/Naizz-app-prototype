import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { RowSkeleton } from '@/components/Skeleton';
import { colors, spacing, type as t } from '@/theme';
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
        <Text style={[t.callout, { fontWeight: '700', color: colors.ink }]}>{item.displayName}</Text>
        <Text style={[t.footnote, { color: colors.textMuted }]}>@{item.username}</Text>
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
      <AppHeader title={title} variant="inline" onBack={() => router.back()} />
      {mode === 'invite' ? (
        <Text style={[t.footnote, { paddingHorizontal: spacing.gutter, paddingBottom: spacing.sm, color: colors.textSec }]}>
          Tap Invite to send a join link to people you follow.
        </Text>
      ) : null}

      {loading ? (
        <RowSkeleton />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <Row item={item} mode={mode} onCall={onCall} onInvite={onInvite} />}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 76 }} />}
          contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : undefined}
          ListEmptyComponent={
            <EmptyState
              icon={mode === 'invite' ? 'user-plus' : 'users'}
              title={mode === 'invite' ? 'No one to invite yet' : type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              subtitle={
                mode === 'invite'
                  ? 'Follow some people first, then invite them to your room.'
                  : type === 'followers'
                    ? 'When people follow you, they show up here.'
                    : 'Find voices you like and follow them.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
