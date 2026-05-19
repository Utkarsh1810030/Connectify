'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function ProviderEarningsPage() {
  const [requestingPayout, setRequestingPayout] = useState(false);
  const qc = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'as-provider'],
    queryFn: () => api.get('/sessions/as-provider').then(r => r.data),
  });

  const { data: payouts } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => api.get('/billing/payouts').then(r => r.data),
  });

  const payoutMutation = useMutation({
    mutationFn: (amount: number) => api.post('/billing/payout/request', { amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] });
      setRequestingPayout(false);
    },
    onError: (err: any) => alert(err.response?.data?.message ?? 'Payout request failed'),
  });

  const completedSessions: any[] = (sessions?.data ?? []).filter((s: any) => s.status === 'completed');
  const totalEarned = completedSessions.reduce((sum: number, s: any) => sum + Number(s.providerEarning ?? 0), 0);
  const pendingPayouts = (payouts?.data ?? []).filter((p: any) => p.status === 'pending');
  const pendingTotal = pendingPayouts.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const available = Math.max(0, totalEarned - pendingTotal);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Earnings</h1>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Earned</p>
          <p className={styles.summaryValue}>₹{totalEarned.toFixed(2)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Pending Payout</p>
          <p className={styles.summaryValue}>₹{pendingTotal.toFixed(2)}</p>
        </div>
        <div className={styles.summaryCard} style={{ background: '#ede9fe' }}>
          <p className={styles.summaryLabel}>Available to Withdraw</p>
          <p className={styles.summaryValue} style={{ color: '#7c3aed' }}>₹{available.toFixed(2)}</p>
          {available >= 100 && !requestingPayout && (
            <button className={styles.payoutBtn} onClick={() => setRequestingPayout(true)}>
              Request Payout
            </button>
          )}
          {requestingPayout && (
            <div className={styles.payoutForm}>
              <p style={{ fontSize: '0.85rem', color: '#374151' }}>Request ₹{available.toFixed(2)}?</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className={styles.cancelBtn} onClick={() => setRequestingPayout(false)}>Cancel</button>
                <button
                  className={styles.confirmBtn}
                  disabled={payoutMutation.isPending}
                  onClick={() => payoutMutation.mutate(available)}
                >
                  {payoutMutation.isPending ? 'Requesting...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Session Earnings</h2>
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Type</span><span>Duration</span><span>Amount</span><span>Your Earning</span><span>Date</span>
        </div>
        {completedSessions.length === 0 && <p className={styles.empty}>No completed sessions yet.</p>}
        {completedSessions.map((s: any) => (
          <div key={s.id} className={styles.tableRow}>
            <span>{s.type}</span>
            <span>{Math.floor(s.totalDurationSec / 60)}m {s.totalDurationSec % 60}s</span>
            <span>₹{Number(s.totalAmount).toFixed(2)}</span>
            <span className={styles.earning}>+₹{Number(s.providerEarning).toFixed(2)}</span>
            <span>{new Date(s.endedAt).toLocaleDateString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
