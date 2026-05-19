import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSessionStore } from '@/stores/session.store';
import { socketService } from '@/services/socket';
import { api } from '@/services/api';
import { agoraService, RtcSurfaceView, VideoSourceType } from '@/services/agora';

export default function VideoSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { endSession } = useSessionStore();

  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEnd = useCallback(async (userInitiated = true) => {
    await agoraService.leave();
    if (userInitiated) {
      await api.post(`/sessions/${id}/end`).catch(() => {});
    }
    endSession();
    router.replace('/(modals)/rate');
  }, [id, endSession]);

  useEffect(() => {
    agoraService.setCallbacks({
      onRemoteJoined: (uid) => setRemoteUid(uid),
      onRemoteLeft: () => setRemoteUid(null),
      onCallEnded: () => handleEnd(false),
    });

    socketService.onSessionEnd(() => handleEnd(false));
    socketService.onLowBalance(() =>
      Alert.alert('Low Balance', 'Your wallet balance is running low.')
    );

    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);

    async function init() {
      try {
        const config = await agoraService.fetchCallConfig(id as string);
        await agoraService.init(config, true);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to connect call');
      } finally {
        setInitializing(false);
      }
    }

    init();

    return () => {
      clearInterval(timer);
      agoraService.leave().catch(() => {});
    };
  }, [id, handleEnd]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    agoraService.muteLocalAudio(next);
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    setCameraOff(next);
    agoraService.muteLocalVideo(next);
  };

  if (error) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Remote video */}
      <View style={styles.remoteVideo}>
        {initializing ? (
          <ActivityIndicator size="large" color="#7c3aed" />
        ) : remoteUid != null ? (
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
          />
        ) : (
          <Text style={styles.remoteLabel}>⏳ Waiting for other party...</Text>
        )}
      </View>

      {/* Local video preview (PiP) */}
      <View style={styles.localVideo}>
        {cameraOff ? (
          <Text style={styles.localLabel}>📷 Off</Text>
        ) : (
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
          />
        )}
      </View>

      <Text style={styles.timer}>{formatTime(elapsed)}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
          <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.endCallBtn]}
          onPress={() =>
            Alert.alert('End Call?', undefined, [
              { text: 'End', style: 'destructive', onPress: () => handleEnd(true) },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        >
          <Text style={styles.controlIcon}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={toggleCamera}>
          <Text style={styles.controlIcon}>{cameraOff ? '📷' : '🎥'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  remoteLabel: { color: '#555', fontSize: 16 },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localLabel: { color: '#aaa', fontSize: 12 },
  timer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallBtn: { backgroundColor: '#ef4444' },
  controlIcon: { fontSize: 24 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 20, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
});
