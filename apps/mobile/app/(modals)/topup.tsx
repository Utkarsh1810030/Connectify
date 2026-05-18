import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useWalletStore } from '@/stores/wallet.store';

const AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function TopUpModal() {
  const [selected, setSelected] = useState<number | null>(null);
  const { setBalance } = useWalletStore();
  const qc = useQueryClient();

  const topupMutation = useMutation({
    mutationFn: (amount: number) => api.post('/billing/topup', { amount }).then(r => r.data),
    onSuccess: async (data) => {
      // In dev without Razorpay keys, this returns a mock Razorpay order
      // Real flow: open Razorpay SDK with orderId, on success call /billing/topup/confirm
      Alert.alert('Top Up Initiated', `Order ID: ${data.orderId}\n\nIn production, Razorpay payment sheet opens here.`);
      const wallet = await api.get('/billing/wallet').then(r => r.data);
      setBalance(wallet.balance);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      router.back();
    },
    onError: () => Alert.alert('Error', 'Failed to initiate top-up. Please try again.'),
  });

  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <Text style={styles.title}>Add Money</Text>
        <Text style={styles.subtitle}>Select amount to add to your wallet</Text>

        <View style={styles.grid}>
          {AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.amountBtn, selected === amt && styles.amountBtnActive]}
              onPress={() => setSelected(amt)}
            >
              <Text style={[styles.amountText, selected === amt && styles.amountTextActive]}>₹{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.payBtn, (!selected || topupMutation.isPending) && styles.payBtnDisabled]}
          onPress={() => selected && topupMutation.mutate(selected)}
          disabled={!selected || topupMutation.isPending}
        >
          {topupMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payText}>Pay {selected ? `₹${selected}` : ''}</Text>
          )}
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
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  amountBtn: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  amountBtnActive: { borderColor: '#6C63FF', backgroundColor: '#EEF2FF' },
  amountText: { fontSize: 16, fontWeight: '600', color: '#555' },
  amountTextActive: { color: '#6C63FF' },
  payBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  payBtnDisabled: { opacity: 0.5 },
  payText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { textAlign: 'center', color: '#999', fontSize: 14 },
});
