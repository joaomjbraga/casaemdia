import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import logger from '@/lib/logger';

export interface AudioPlayerProps {
  uri: string;
  name?: string;
}

const formatTime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

type WaveformState = {
  id: number;
  duration: number;
  heightRatio: number;
};

const BAR_COUNT = 9;

const generateWaveform = (bars: number): WaveformState[] => {
  const total = bars;
  const result: WaveformState[] = [];
  let id = 0;
  while (result.length < total) {
    const next = 1 + Math.floor(Math.random() * 3);
    const take = Math.min(next, total - result.length);
    for (let i = 0; i < take; i++) {
      result.push({
        id: id++,
        duration: 1000 / total,
        heightRatio: 0.25 + Math.random() * 0.75,
      });
    }
  }
  return result;
};

export default function AudioPlayer({ uri, name }: AudioPlayerProps) {
  const player = useAudioPlayer(uri, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const insets = useSafeAreaInsets();
  const finishedRef = useRef(false);

  const waveform = useMemo(() => {
    if (!status.isLoaded) return [];
    return generateWaveform(BAR_COUNT);
  }, [status.isLoaded]);

  const durationMs = Math.max(0, status.duration) * 1000;
  const positionMs = Math.min(durationMs, Math.max(0, status.currentTime) * 1000);

  useEffect(() => {
    if (status.didJustFinish) {
      finishedRef.current = true;
    }
  }, [status.didJustFinish]);

  const togglePlayback = useCallback(async () => {
    try {
      if (finishedRef.current) {
        finishedRef.current = false;
        await player.seekTo(0);
        player.play();
        return;
      }

      if (status.playing) {
        player.pause();
      } else {
        await player.seekTo(0);
        player.play();
      }
    } catch (error) {
      logger.error('[AudioPlayer] toggle error', error);
    }
  }, [player, status.playing]);

  const seek = useCallback(
    async (event: any) => {
      try {
        const layout = event?.nativeEvent?.layout;
        if (!layout || !status.duration) return;
        const x = event?.nativeEvent?.locationX ?? 0;
        const ratio = Math.max(0, Math.min(1, x / layout.width));
        const seconds = ratio * status.duration;
        await player.seekTo(seconds);
        finishedRef.current = false;
      } catch (error) {
        logger.error('[AudioPlayer] seek error', error);
      }
    },
    [player, status.duration],
  );

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <TouchableOpacity
        onPress={togglePlayback}
        activeOpacity={0.8}
        style={styles.playButton}
        disabled={!status.isLoaded}
      >
        <Text style={styles.playText}>{!status.isLoaded ? '' : status.playing ? '❚❚' : '▶'}</Text>
      </TouchableOpacity>

      <View style={styles.details}>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {name || 'Mensagem de áudio'}
          </Text>
          {!!status.duration && (
            <Text style={styles.time}>
              {formatTime(status.currentTime)} / {formatTime(status.duration)}
            </Text>
          )}
        </View>

        <TouchableOpacity activeOpacity={1} onPress={seek} style={styles.waveRow}>
          {waveform.length === 0 ? (
            <View style={styles.waveEmpty}>
              <Text style={styles.waveEmptyText}>Carregando...</Text>
            </View>
          ) : (
            waveform.map((item, index) => {
              const prev =
                index === 0
                  ? 0
                  : waveform.slice(0, index).reduce((acc, cur) => acc + cur.duration, 0);
              const completed = positionMs >= prev + item.duration;
              const isPlayingHead = status.playing && !completed && positionMs >= prev;

              return (
                <WaveformBar
                  key={item.id}
                  active={completed || isPlayingHead}
                  heightRatio={item.heightRatio}
                />
              );
            })
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WaveformBar({ active, heightRatio }: { active: boolean; heightRatio: number }) {
  const height = 6 + Math.max(0.35, heightRatio) * 18;

  return (
    <View
      style={[styles.waveBar, active ? styles.waveBarActive : styles.waveBarInactive, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${Colors.light.primary}14`,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingTop: 12,
    overflow: 'hidden',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.light.primary}2a`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  playText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    includeFontPadding: false,
  },
  details: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.1,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
    marginTop: 2,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
  },
  waveEmpty: {
    flex: 1,
    alignItems: 'center',
  },
  waveEmptyText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.mutedText,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  waveBarActive: {
    backgroundColor: Colors.light.text,
  },
  waveBarInactive: {
    backgroundColor: `${Colors.light.mutedText}44`,
  },
});
