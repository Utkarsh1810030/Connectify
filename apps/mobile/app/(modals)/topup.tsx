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
    mutationFn: async (amount: number) => {
      // Step 1: Create Razorpay order
      const { data: order } = await api.post('/billing/topup/order', { amount });

      // Step 2: In production, open Razorpay SDK here with order.orderId
      // For dev (no Razorpay keys), the orderId is a mock — we proceed directly to verify
      const paymentId = `pay_dev_${Date.now()}`;

      // Step 3: Verify payment and credit wallet
      const { data } = await api.post('/billing/topup/verify', {
        orderId: order.orderId,
        paymentId,
        signature: 'dev_bypass',
        amount,
      });
      return data;
    },
    onSuccess: async (data) => {
      setBalance(data.balance);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      Alert.alert('Success', `₹${selected} added to your wallet.`);
      router.back();
    },
    onError: () => Alert.alert('Error', 'Failed to add money. Please try again.'),
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
