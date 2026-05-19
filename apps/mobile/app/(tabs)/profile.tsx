import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { useWalletStore } from '@/stores/wallet.store';

const KYC_STATUS_COLOR: Record<string, string> = {
  not_submitted: '#9ca3af',
  pending: '#f59e0b',
  approved: '#16a34a',
  rejected: '#ef4444',
};

function KycSection({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [docUrl, setDocUrl] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc', userId],
    queryFn: () => api.get('/providers/kyc').then(r => r.data),
  });

  const submitKyc = useMutation({
    mutationFn: (documentUrl: string) => api.post('/providers/kyc', { documentUrl }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc', userId] });
      setShowForm(false);
      setDocUrl('');
      Alert.alert('Submitted', 'Your KYC documents have been submitted for review.');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit KYC'),
  });

  if (isLoading) return <ActivityIndicator style={{ marginVertical: 12 }} />;

  const status = kyc?.kycStatus ?? 'not_submitted';
  const color = KYC_STATUS_COLOR[status] ?? '#9ca3af';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>KYC Verification</Text>
      <View style={styles.kycCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.menuText}>Verification Status</Text>
          <View style={[styles.kycBadge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.kycBadgeText, { color }]}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
        </View>
        {status === 'rejected' && kyc?.kycRejectionReason && (
          <Text style={styles.kycReason}>Reason: {kyc.kycRejectionReason}</Text>
        )}
        {(status === 'not_submitted' || status === 'rejected') && (
          <>
            {showForm ? (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  style={styles.kycInput}
                  placeholder="Document URL (Aadhaar/PAN)"
                  value={docUrl}
                  onChangeText={setDocUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.kycSubmitBtn, (!docUrl.trim() || submitKyc.isPending) && { opacity: 0.5 }]}
                  disabled={!docUrl.trim() || submitKyc.isPending}
                  onPress={() => submitKyc.mutate(docUrl.trim())}
                >
                  {submitKyc.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.kycSubmitText}>Submit</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Text style={[styles.menuText, { textAlign: 'center', marginTop: 8, color: '#999' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.kycSubmitBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.kycSubmitText}>{status === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const { balance } = useWalletStore();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  });

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const isProvider = user?.role === 'provider';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? user?.phone ?? '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Set your name'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.walletCard}>
          <Text style={styles.balance}>₹{balance.toFixed(2)}</Text>
          <TouchableOpacity style={styles.topupBtn} onPress={() => router.push('/(modals)/topup')}>
            <Text style={styles.topupText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isProvider && user?.id && <KycSection userId={user.id} />}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Transaction History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 70, paddingBottom: 32 },
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
  name: { fontSize: 20, fontWeight: '700', color: '#222' },
  phone: { fontSize: 14, color: '#888', marginTop: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#999', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  walletCard: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balance: { fontSize: 28, fontWeight: '700', color: '#fff' },
  topupBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  topupText: { color: '#fff', fontWeight: '600' },
  menuItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuText: { fontSize: 15, color: '#333' },
  logoutItem: { marginTop: 8 },
  logoutText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  kycCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  kycBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  kycBadgeText: { fontSize: 11, fontWeight: '700' },
  kycReason: { fontSize: 13, color: '#ef4444', marginTop: 8 },
  kycInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 8 },
  kycSubmitBtn: { backgroundColor: '#6C63FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  kycSubmitText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
