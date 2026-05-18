import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSessionStore } from '@/stores/session.store';
import { socketService } from '@/services/socket';
import { api } from '@/services/api';

export default function VoiceSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { endSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);

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
      <Text style={styles.label}>Voice Call</Text>
      <Text style={styles.timer}>{formatTime(elapsed)}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setMuted(m => !m)}>
          <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
          <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.endCallBtn]}
          onPress={() => Alert.alert('End Call?', undefined, [
            { text: 'End', style: 'destructive', onPress: () => handleEnd(true) },
            { text: 'Cancel', style: 'cancel' },
          ])}
        >
          <Text style={styles.controlIcon}>📵</Text>
          <Text style={[styles.controlLabel, { color: '#fff' }]}>End Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#aaa', marginBottom: 16 },
  timer: { fontSize: 56, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'], marginBottom: 60 },
  controls: { flexDirection: 'row', gap: 32 },
  controlBtn: { alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 40 },
  endCallBtn: { backgroundColor: '#ef4444' },
  controlIcon: { fontSize: 28 },
  controlLabel: { color: '#fff', fontSize: 13 },
});
