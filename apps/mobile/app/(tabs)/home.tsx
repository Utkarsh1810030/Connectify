import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useWalletStore } from '@/stores/wallet.store';
import type { ProviderListItem } from '@connectify/types';

function ProviderCard({ provider }: { provider: ProviderListItem }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/provider/${provider.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.displayName}>{provider.displayName}</Text>
        <View style={[styles.onlineBadge, { backgroundColor: provider.isOnline ? '#22c55e' : '#d1d5db' }]} />
      </View>
      <Text style={styles.bio} numberOfLines={2}>{provider.bio ?? 'No bio yet'}</Text>
      <View style={styles.rateRow}>
        <Text style={styles.rate}>₹{provider.chatRatePerMin}/min chat</Text>
        <Text style={styles.rating}>★ {provider.avgRating.toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { balance } = useWalletStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get('/providers').then(r => r.data),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Companion</Text>
        <TouchableOpacity onPress={() => router.push('/(modals)/topup')} style={styles.walletPill}>
          <Text style={styles.walletText}>₹{balance.toFixed(0)}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#6C63FF" />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProviderCard provider={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />}
          ListEmptyComponent={
            <Text style={styles.empty}>No companions available right now.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  walletPill: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  walletText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  displayName: { fontSize: 17, fontWeight: '600', color: '#222' },
  onlineBadge: { width: 10, height: 10, borderRadius: 5 },
  bio: { fontSize: 14, color: '#666', marginBottom: 10 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rate: { fontSize: 13, color: '#6C63FF', fontWeight: '500' },
  rating: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },
  loader: { marginTop: 80 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
