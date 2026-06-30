import { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, radius, shadow } from '@/theme';
import { Waveform } from './Waveform';
import { usePlayback } from '@/lib/playback';
import { formatDuration } from '@/lib/format';

type Props = {
  id: string; // unique playback id (post/reply/message id)
  url: string;
  durationSeconds: number;
  size?: 'sm' | 'md';
  onFirstPlay?: () => void;
};

// Dark "voice pill" player used across the app (feed, replies, DMs, profile).
export function VoicePlayer({ id, url, durationSeconds, size = 'md', onFirstPlay }: Props) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const { activeId, setActiveId } = usePlayback();
  const firedRef = useRef(false);
  const btn = size === 'sm' ? 30 : 36;
  const bars = size === 'sm' ? 22 : 28;

  useEffect(() => {
    if (activeId !== id && status.playing) player.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
      player.pause();
      if (activeId === id) setActiveId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const onToggle = () => {
    if (status.playing) {
      player.pause();
      setActiveId(null);
    } else {
      setActiveId(id);
      player.play();
      if (!firedRef.current) {
        firedRef.current = true;
        onFirstPlay?.();
      }
    }
  };

  const total = status.duration && status.duration > 0 ? status.duration : durationSeconds;
  const progress = total > 0 ? Math.min(1, (status.currentTime ?? 0) / total) : 0;
  const playedBars = status.playing || (status.currentTime ?? 0) > 0 ? Math.round(progress * bars) : 0;
  const label =
    status.playing || (status.currentTime ?? 0) > 0
      ? formatDuration(status.currentTime ?? 0)
      : formatDuration(durationSeconds);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.pill,
        borderRadius: radius.pill,
        paddingVertical: 5,
        paddingLeft: 5,
        paddingRight: 14,
        ...shadow.xs,
      }}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause' : 'Play voice'}
        style={({ pressed }) => ({
          width: btn,
          height: btn,
          borderRadius: btn / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <Feather name={status.playing ? 'pause' : 'play'} size={size === 'sm' ? 14 : 16} color={colors.white} />
      </Pressable>
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Waveform bars={bars} max={size === 'sm' ? 18 : 22} barWidth={2.5} gap={2.5} played={playedBars} color={colors.onPill} trackColor={colors.pillTrack} />
      </View>
      <Text style={{ color: colors.onPill, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
