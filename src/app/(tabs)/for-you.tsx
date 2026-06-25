import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { VoiceCard } from '@/components/VoiceCard';
import { VoicePlayer } from '@/components/VoicePlayer';
import { colors, radius } from '@/theme';
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar seed={user.username} name={user.displayName} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{user.displayName}</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>@{user.username}</Text>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ width: 18, fontSize: 18, fontWeight: '800', color: colors.textMuted }}>{rank}</Text>
      <Avatar seed={post.username} name={post.displayName} size={44} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
          {post.caption || `${post.displayName}'s voice`}
        </Text>
        <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 1 }}>
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
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: 26, fontWeight: '800', color: colors.ink }}>For You</Text>
        <IconButton name="search" />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 22, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : tab === 'Following' ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {following.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.textSec, textAlign: 'center', marginTop: 40, lineHeight: 20 }}>
              Follow people and their voices will show up here.
            </Text>
          ) : (
            following.map((p) => <VoiceCard key={p.id} post={p} onChanged={load} />)
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
            <View style={{ backgroundColor: colors.cardAlt, borderRadius: radius.xl, padding: 16, gap: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.textMuted }}>VOICES YOU MIGHT LIKE</Text>
              {suggested.map((u) => (
                <SuggestedRow key={u.id} user={u} />
              ))}
            </View>
          ) : null}

          <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.textMuted }}>
            {tag === 'Trending' ? 'TRENDING NOW' : `TAGGED ${tag.toUpperCase()}`}
          </Text>
          {shownTrending.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.textSec }}>
              {tag === 'Trending' ? 'No trending voices yet — post one!' : `No voices tagged ${tag} yet.`}
            </Text>
          ) : (
            <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, gap: 16 }}>
              {shownTrending.slice(0, 8).map((p, i) => (
                <TrendingRow key={p.id} rank={i + 1} post={p} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
