import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TouchableOpacity } from 'react-native';
import { api } from '@/services/api';
import type { Session } from '@connectify/types';

function SessionRow({ session }: { session: Session }) {
  const duration = Math.round(session.totalDurationSec / 60);
  const date = new Date(session.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.type}>{session.type.toUpperCase()} · {date}</Text>
        <Text style={styles.meta}>{duration} min · ₹{Number(session.totalAmount).toFixed(2)}</Text>
      </View>
      <Text style={[styles.status, session.status === 'completed' ? styles.completed : styles.other]}>
        {session.status}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions').then(r => r.data),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6C63FF" style={styles.loader} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <SessionRow session={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No sessions yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  list: { padding: 16, gap: 8 },
  row: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: { fontSize: 14, fontWeight: '600', color: '#333' },
  meta: { fontSize: 13, color: '#888', marginTop: 2 },
  status: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  completed: { color: '#22c55e' },
  other: { color: '#f59e0b' },
  loader: { marginTop: 60 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60 },
});
