import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSessionStore } from '@/stores/session.store';
import { socketService } from '@/services/socket';
import { api } from '@/services/api';

export default function VideoSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { endSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    socketService.onSessionEnd(() => handleEnd(false));
    socketService.onLowBalance(() =>
      Alert.alert('Low Balance', 'Your wallet balance is running low.')
    );
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEnd = useCallback(async (userInitiated = true) => {
    if (userInitiated) {
      await api.post(`/sessions/${id}/end`).catch(() => {});
    }
    endSession();
    router.replace('/(modals)/rate');
  }, [id, endSession]);

  return (
    <View style={styles.container}>
      {/* Remote video placeholder — Agora RtcSurfaceView mounts here */}
      <View style={styles.remoteVideo}>
        <Text style={styles.remoteLabel}>Remote Video</Text>
      </View>

      {/* Local video preview */}
      <View style={styles.localVideo}>
        <Text style={styles.localLabel}>{cameraOff ? '📷 Off' : 'You'}</Text>
      </View>

      <Text style={styles.timer}>{formatTime(elapsed)}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setMuted(m => !m)}>
          <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.endCallBtn]}
          onPress={() => Alert.alert('End Call?', undefined, [
            { text: 'End', style: 'destructive', onPress: () => handleEnd(true) },
            { text: 'Cancel', style: 'cancel' },
          ])}
        >
          <Text style={styles.controlIcon}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => setCameraOff(c => !c)}>
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#444',
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
  controlBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  endCallBtn: { backgroundColor: '#ef4444' },
  controlIcon: { fontSize: 24 },
});
