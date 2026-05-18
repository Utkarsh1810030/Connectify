import { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

const CATEGORIES = [
  { key: 'emotional_support', label: 'Emotional Support' },
  { key: 'career_advice', label: 'Career Advice' },
  { key: 'language_practice', label: 'Language Practice' },
  { key: 'hobby_chat', label: 'Hobby Chat' },
  { key: 'study_buddy', label: 'Study Buddy' },
  { key: 'general', label: 'General' },
];

export default function SearchScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['providers', selectedCategory],
    queryFn: () => {
      const params = selectedCategory ? `?category=${selectedCategory}` : '';
      return api.get(`/providers${params}`).then(r => r.data);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={c => c.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedCategory === item.key && styles.chipActive]}
            onPress={() => setSelectedCategory(prev => prev === item.key ? undefined : item.key)}
          >
            <Text style={[styles.chipText, selectedCategory === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <ActivityIndicator color="#6C63FF" style={styles.loader} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/provider/${item.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.categories2}>{item.categories?.slice(0, 2).join(', ')}</Text>
              </View>
              <Text style={styles.rate}>₹{item.chatRatePerMin}/min</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No results found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#333' },
  categories: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#6C63FF' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, gap: 2 },
  row: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 15, fontWeight: '600', color: '#222' },
  categories2: { fontSize: 12, color: '#888', marginTop: 2 },
  rate: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },
  loader: { marginTop: 60 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60 },
});
