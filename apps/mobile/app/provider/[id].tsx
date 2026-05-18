import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useWalletStore } from '@/stores/wallet.store';
import { useSessionStore } from '@/stores/session.store';
import type { SessionType } from '@connectify/types';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { balance } = useWalletStore();
  const { startSession } = useSessionStore();

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => api.get(`/providers/${id}`).then(r => r.data),
  });

  const startMutation = useMutation({
    mutationFn: (type: SessionType) => api.post('/sessions', { providerId: id, type }).then(r => r.data),
    onSuccess: (session) => {
      startSession(session);
      router.push(`/session/${session.type}/${session.id}`);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to start session');
    },
  });

  const handleStart = (type: SessionType, rate: number) => {
    if (balance < rate * 2) {
      Alert.alert(
        'Low Balance',
        `You need at least ₹${(rate * 2).toFixed(0)} to start. Add money to your wallet.`,
        [
          { text: 'Add Money', onPress: () => router.push('/(modals)/topup') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    Alert.alert(
      `Start ${type} session`,
      `Rate: ₹${rate}/min. Your balance: ₹${balance.toFixed(0)}`,
      [
        { text: 'Start', onPress: () => startMutation.mutate(type) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} color="#6C63FF" />;
  }

  if (!provider) return null;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{provider.displayName[0]}</Text>
        </View>
        <Text style={styles.name}>{provider.displayName}</Text>
        <Text style={styles.rating}>★ {Number(provider.avgRating).toFixed(1)} · {provider.totalSessions} sessions</Text>
        {provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}
        <View style={styles.tags}>
          {provider.categories?.map((c: string) => (
            <View key={c} style={styles.tag}>
              <Text style={styles.tagText}>{c.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Text style={styles.actionsTitle}>Start a Session</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleStart('chat', provider.chatRatePerMin)}
          disabled={startMutation.isPending}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionName}>Chat</Text>
            <Text style={styles.actionRate}>₹{provider.chatRatePerMin}/min</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleStart('voice', provider.voiceRatePerMin)}
          disabled={startMutation.isPending}
        >
          <Text style={styles.actionIcon}>📞</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionName}>Voice Call</Text>
            <Text style={styles.actionRate}>₹{provider.voiceRatePerMin}/min</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => handleStart('video', provider.videoRatePerMin)}
          disabled={startMutation.isPending}
        >
          <Text style={styles.actionIcon}>📹</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionName}>Video Call</Text>
            <Text style={styles.actionRate}>₹{provider.videoRatePerMin}/min</Text>
          </View>
        </TouchableOpacity>

        {startMutation.isPending && <ActivityIndicator color="#6C63FF" style={{ marginTop: 16 }} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loader: { flex: 1, marginTop: 100 },
  back: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  backText: { color: '#6C63FF', fontSize: 16 },
  profile: { backgroundColor: '#fff', alignItems: 'center', padding: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 4 },
  rating: { fontSize: 14, color: '#f59e0b', fontWeight: '600', marginBottom: 12 },
  bio: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, color: '#6C63FF', fontWeight: '500', textTransform: 'capitalize' },
  actions: { padding: 20 },
  actionsTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  actionIcon: { fontSize: 28 },
  actionName: { fontSize: 16, fontWeight: '600', color: '#222' },
  actionRate: { fontSize: 13, color: '#6C63FF', marginTop: 2 },
});
