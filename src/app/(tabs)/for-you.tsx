import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { VoiceCard } from '@/components/VoiceCard';
import { VoicePlayer } from '@/components/VoicePlayer';
import { EmptyState } from '@/components/EmptyState';
import { SectionLabel } from '@/components/SectionLabel';
import { FeedSkeleton } from '@/components/Skeleton';
import { colors, spacing, type } from '@/theme';
import { fetchFeed, incrementPlays } from '@/lib/api';
import { suggestedUsers, toggleFollow } from '@/lib/social';
import { compact } from '@/lib/format';
import type { FeedPost, SuggestedUser } from '@/lib/types';

const TABS = ['For You', 'Following', 'Topics'] as const;
type Tab = (typeof TABS)[number];

function SuggestedRow({ user }: { user: SuggestedUser }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const onFollow = async () => {
    if (busy) return;
    setBusy(true);
    const was = following;
    setFollowing(!was);
    try {
      await toggleFollow(user.id, was);
    } catch {
      setFollowing(was);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Avatar seed={user.username} name={user.displayName} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={[type.callout, { fontWeight: '700', color: colors.ink }]}>{user.displayName}</Text>
        <Text style={[type.footnote, { color: colors.textMuted }]}>@{user.username}</Text>
      </View>
      <Button
        label={following ? 'Following' : 'Follow'}
        variant={following ? 'secondary' : 'primary'}
        height={36}
        radiusOverride={18}
        fontSize={14}
        onPress={onFollow}
      />
    </View>
  );
}

function TrendingRow({ rank, post }: { rank: number; post: FeedPost }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Text style={{ width: 18, ...type.title3, color: colors.textMuted }}>{rank}</Text>
      <Avatar seed={post.username} name={post.displayName} size={44} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={[type.subhead, { fontWeight: '700', color: colors.ink }]}>
          {post.caption || `${post.displayName}'s voice`}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 1 }]}>
          {post.displayName} · {compact(post.playCount)} plays
        </Text>
      </View>
      <View style={{ width: 118 }}>
        <VoicePlayer id={`t-${post.id}`} url={post.audioUrl} durationSeconds={post.durationSeconds} size="sm" onFirstPlay={() => incrementPlays(post.id)} />
      </View>
    </View>
  );
}

export default function ForYouScreen() {
  const [tab, setTab] = useState<Tab>('For You');
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [trending, setTrending] = useState<FeedPost[]>([]);
  const [following, setFollowing] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState('Trending');

  const TAGS = ['Trending', '#comedy', '#news', '#spanish', '#music'];
  const shownTrending =
    tag === 'Trending' ? trending : trending.filter((p) => p.caption.toLowerCase().includes(tag.toLowerCase()));

  const load = useCallback(async () => {
    try {
      const [s, t, f] = await Promise.all([suggestedUsers(4), fetchFeed('trending'), fetchFeed('following')]);
      setSuggested(s);
      setTrending(t);
      setFollowing(f);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <View style={{ height: 56, paddingHorizontal: spacing.gutter, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[type.title1, { flex: 1, color: colors.ink }]}>Discover</Text>
        <IconButton name="search" accessibilityLabel="Search" />
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

      {loading ? (
        <FeedSkeleton />
      ) : tab === 'Following' ? (
        <ScrollView contentContainerStyle={{ padding: spacing.gutter, gap: spacing.lg }}>
          {following.length === 0 ? (
            <EmptyState
              icon="users"
              title="Your following feed is quiet"
              subtitle="Follow a few people and their voices will show up here."
            />
          ) : (
            following.map((p) => <VoiceCard key={p.id} post={p} onChanged={load} />)
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.gutter, gap: spacing.xl }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {TAGS.map((t) => (
              <Chip
                key={t}
                label={t}
                icon={t === 'Trending' ? 'trending-up' : undefined}
                active={tag === t}
                onPress={() => setTag(t)}
              />
            ))}
          </ScrollView>

          {suggested.length > 0 ? (
            <Card padding={spacing.lg} style={{ gap: spacing.lg }}>
              <SectionLabel>Voices you might like</SectionLabel>
              {suggested.map((u) => (
                <SuggestedRow key={u.id} user={u} />
              ))}
            </Card>
          ) : null}

          <SectionLabel>{tag === 'Trending' ? 'Trending now' : `Tagged ${tag}`}</SectionLabel>
          {shownTrending.length === 0 ? (
            <EmptyState
              compact
              icon="trending-up"
              title={tag === 'Trending' ? 'Nothing trending yet' : `No ${tag} voices yet`}
              subtitle={tag === 'Trending' ? 'Post a voice and it could land right here.' : `Be the first to post a ${tag} voice.`}
            />
          ) : (
            <Card padding={spacing.lg} style={{ gap: spacing.lg }}>
              {shownTrending.slice(0, 8).map((p, i) => (
                <TrendingRow key={p.id} rank={i + 1} post={p} />
              ))}
            </Card>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
