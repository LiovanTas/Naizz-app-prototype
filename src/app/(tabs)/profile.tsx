import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Pressable, Share } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { VoiceCard } from '@/components/VoiceCard';
import { colors } from '@/theme';
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
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{num}</Text>
      <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 2 }}>{label}</Text>
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
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const shown = tab === 'Liked' ? liked : posts;

  return (
    <Screen>
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '800', color: colors.ink }}>@{profile?.username ?? 'me'}</Text>
        <IconButton
          name="share"
          onPress={() =>
            Share.share({ message: `Listen to @${profile?.username ?? 'me'} on Naizz — say it out loud.` }).catch(() => {})
          }
        />
        <IconButton name="menu" onPress={onMenu} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <Avatar seed={profile?.username ?? 'me'} name={profile?.displayName ?? 'Me'} size={84} ring={colors.primary} imageUrl={profile?.avatarUrl} />
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat num={`${profile?.voices ?? 0}`} label="Voices" onPress={() => setTab('Voices')} />
              <Stat num={compact(profile?.followers ?? 0)} label="Followers" onPress={() => router.push({ pathname: '/connections', params: { userId: 'me', type: 'followers' } })} />
              <Stat num={compact(profile?.following ?? 0)} label="Following" onPress={() => router.push({ pathname: '/connections', params: { userId: 'me', type: 'following' } })} />
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>{profile?.displayName ?? 'Your name'}</Text>
            {profile?.bio ? (
              <Text style={{ fontSize: 14, color: colors.textSec, lineHeight: 20, marginTop: 4 }}>{profile.bio}</Text>
            ) : (
              <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 4 }}>
                Add a bio so people know what you sound off about.
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Edit profile" variant="dark" height={46} radiusOverride={12} fill style={{ flex: 1 }} onPress={() => router.push('/edit-profile')} />
            <Button
              label="Share"
              variant="secondary"
              height={46}
              radiusOverride={12}
              onPress={() =>
                Share.share({ message: `Listen to @${profile?.username ?? 'me'} on Naizz — say it out loud.` }).catch(() => {})
              }
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 24, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          {TABS.map((t) => {
            const on = t === tab;
            return (
              <Pressable key={t} onPress={() => setTab(t)} style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: on ? '700' : '500', color: on ? colors.ink : colors.textMuted }}>{t}</Text>
                {on ? <View style={{ height: 2.5, backgroundColor: colors.primary, borderRadius: 2, marginTop: 8 }} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ padding: 16, gap: 14 }}>
          {tab === 'About' ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, color: colors.ink }}>{profile?.bio || 'No bio yet.'}</Text>
              <Text style={{ fontSize: 13.5, color: colors.textMuted }}>@{profile?.username}</Text>
              <Text style={{ fontSize: 13.5, color: colors.textMuted }}>{profile?.voices ?? 0} voices posted</Text>
            </View>
          ) : shown.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.textSec, lineHeight: 20 }}>
              {tab === 'Liked' ? 'Voices you like will appear here.' : 'No voices yet — tap the mic to record your first.'}
            </Text>
          ) : (
            shown.map((p) => <VoiceCard key={p.id} post={p} onChanged={load} canDelete={tab === 'Voices'} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
