import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Pressable, Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { VoiceCard } from '@/components/VoiceCard';
import { EmptyState } from '@/components/EmptyState';
import { colors, spacing, type } from '@/theme';
import { compact } from '@/lib/format';
import { fetchUserPosts, fetchLikedPosts } from '@/lib/api';
import { getFullProfile } from '@/lib/social';
import { useAuth } from '@/lib/auth';
import type { FeedPost, FullProfile } from '@/lib/types';

const TABS = ['Voices', 'Liked', 'About'] as const;
type Tab = (typeof TABS)[number];

function Stat({ num, label, onPress }: { num: string; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={{ alignItems: 'center' }}>
      <Text style={[type.title2, { color: colors.ink }]}>{num}</Text>
      <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [liked, setLiked] = useState<FeedPost[]>([]);
  const [tab, setTab] = useState<Tab>('Voices');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [p, mine, faves] = await Promise.all([
        getFullProfile(user.id),
        fetchUserPosts(user.id),
        fetchLikedPosts(user.id),
      ]);
      setProfile(p);
      setPosts(mine);
      setLiked(faves);
    } catch {
      /* ignore */
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onMenu = () => {
    Alert.alert('Account', undefined, [
      { text: 'Edit profile', onPress: () => router.push('/edit-profile') },
      { text: 'Settings', onPress: () => router.push('/settings') },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onShare = () =>
    Share.share({ message: `Listen to @${profile?.username ?? 'me'} on Naizz — say it out loud.` }).catch(() => {});

  const shown = tab === 'Liked' ? liked : posts;

  return (
    <Screen>
      <View style={{ height: 56, paddingHorizontal: spacing.gutter, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[type.title2, { flex: 1, color: colors.ink }]}>@{profile?.username ?? 'me'}</Text>
        <IconButton name="share" accessibilityLabel="Share profile" onPress={onShare} />
        <IconButton name="menu" accessibilityLabel="Account menu" onPress={onMenu} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
            <Avatar seed={profile?.username ?? 'me'} name={profile?.displayName ?? 'Me'} size={84} ring={colors.primary} imageUrl={profile?.avatarUrl} />
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat num={`${profile?.voices ?? 0}`} label="Voices" onPress={() => setTab('Voices')} />
              <Stat num={compact(profile?.followers ?? 0)} label="Followers" onPress={() => router.push({ pathname: '/connections', params: { userId: 'me', type: 'followers' } })} />
              <Stat num={compact(profile?.following ?? 0)} label="Following" onPress={() => router.push({ pathname: '/connections', params: { userId: 'me', type: 'following' } })} />
            </View>
          </View>

          <View>
            <Text style={[type.title3, { color: colors.ink }]}>{profile?.displayName ?? 'Your name'}</Text>
            {profile?.bio ? (
              <Text style={[type.subhead, { color: colors.textSec, marginTop: spacing.xs }]}>{profile.bio}</Text>
            ) : (
              <Text style={[type.subhead, { color: colors.textMuted, marginTop: spacing.xs }]}>
                Add a bio so people know what you sound off about.
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label="Edit profile" variant="dark" height={46} radiusOverride={12} fill style={{ flex: 1 }} onPress={() => router.push('/edit-profile')} />
            <Button label="Share" variant="secondary" icon="share" height={46} radiusOverride={12} onPress={onShare} />
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.gutter, gap: spacing.xxl, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          {TABS.map((t) => {
            const on = t === tab;
            return (
              <Pressable key={t} onPress={() => setTab(t)} style={{ paddingVertical: spacing.md }}>
                <Text style={[type.callout, { fontWeight: on ? '700' : '500', color: on ? colors.ink : colors.textMuted }]}>{t}</Text>
                {on ? <View style={{ height: 2.5, backgroundColor: colors.primary, borderRadius: 2, marginTop: spacing.sm }} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ padding: spacing.gutter, gap: spacing.lg }}>
          {tab === 'About' ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={[type.body, { color: colors.ink }]}>{profile?.bio || 'No bio yet.'}</Text>
              <Text style={[type.footnote, { color: colors.textMuted }]}>@{profile?.username}</Text>
              <Text style={[type.footnote, { color: colors.textMuted }]}>{profile?.voices ?? 0} voices posted</Text>
            </View>
          ) : shown.length === 0 ? (
            <EmptyState
              compact
              icon={tab === 'Liked' ? 'heart' : 'mic'}
              title={tab === 'Liked' ? 'No liked voices yet' : 'No voices yet'}
              subtitle={tab === 'Liked' ? 'Voices you like will be collected here.' : 'Tap the mic to record your first voice.'}
              actionLabel={tab === 'Voices' ? 'Record a voice' : undefined}
              onAction={tab === 'Voices' ? () => router.push('/record') : undefined}
            />
          ) : (
            shown.map((p) => <VoiceCard key={p.id} post={p} onChanged={load} canDelete={tab === 'Voices'} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
