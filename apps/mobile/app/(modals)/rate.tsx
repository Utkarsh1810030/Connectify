import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSessionStore } from '@/stores/session.store';

export default function RateModal() {
  const { lastSession } = useSessionStore();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const rateMutation = useMutation({
    mutationFn: () =>
      api.post('/ratings', { sessionId: lastSession?.id, score, comment: comment.trim() || undefined }),
    onSuccess: () => router.replace('/(tabs)/home'),
    onError: () => Alert.alert('Error', 'Failed to submit rating'),
  });

  if (!lastSession) {
    router.replace('/(tabs)/home');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Rate Your Session</Text>
        <Text style={styles.subtitle}>How was your experience?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setScore(s)}>
              <Text style={[styles.star, s <= score && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="Leave a comment (optional)"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.submitBtn, (!score || rateMutation.isPending) && styles.submitBtnDisabled]}
          onPress={() => rateMutation.mutate()}
          disabled={!score || rateMutation.isPending}
        >
          {rateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Rating</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  stars: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 24 },
  star: { fontSize: 40, color: '#ddd' },
  starActive: { color: '#f59e0b' },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { textAlign: 'center', color: '#999', fontSize: 14 },
});
