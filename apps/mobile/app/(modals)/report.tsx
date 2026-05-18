import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useSessionStore } from '@/stores/session.store';

const REASONS = ['inappropriate_behavior', 'contact_sharing', 'harassment', 'spam', 'other'];

export default function ReportModal() {
  const { lastSession } = useSessionStore();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: () =>
      api.post('/moderation/reports', {
        reportedUserId: lastSession?.providerId,
        sessionId: lastSession?.id,
        reason,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      Alert.alert('Report Submitted', 'Thank you. Our team will review this.');
      router.back();
    },
    onError: () => Alert.alert('Error', 'Failed to submit report'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Report User</Text>
        <Text style={styles.subtitle}>Select the reason for your report</Text>

        {REASONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.reasonBtn, reason === r && styles.reasonBtnActive]}
            onPress={() => setReason(r)}
          >
            <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
              {r.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}

        <TextInput
          style={styles.descInput}
          placeholder="Additional details (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.submitBtn, (!reason || reportMutation.isPending) && styles.submitBtnDisabled]}
          onPress={() => reportMutation.mutate()}
          disabled={!reason || reportMutation.isPending}
        >
          {reportMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  reasonBtn: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  reasonBtnActive: { borderColor: '#6C63FF', backgroundColor: '#EEF2FF' },
  reasonText: { fontSize: 14, color: '#555', textTransform: 'capitalize' },
  reasonTextActive: { color: '#6C63FF', fontWeight: '600' },
  descInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginVertical: 12,
  },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { textAlign: 'center', color: '#999', fontSize: 14 },
});
