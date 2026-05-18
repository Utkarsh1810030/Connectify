'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './page.module.css';
import type { Wallet, Transaction } from '@connectify/types';

export default function WalletPage() {
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: () => api.get('/billing/wallet').then(r => r.data),
  });

  const { data: txns } = useQuery<{ data: Transaction[] }>({
    queryKey: ['transactions'],
    queryFn: () => api.get('/billing/transactions').then(r => r.data),
  });

  return (
    <div>
      <h1 className={styles.title}>Wallet</h1>

      <div className={styles.balanceCard}>
        <p className={styles.balanceLabel}>Available Balance</p>
        <p className={styles.balance}>₹{Number(wallet?.balance ?? 0).toFixed(2)}</p>
        <button className={styles.topupBtn}>Add Money</button>
      </div>

      <h2 className={styles.sectionTitle}>Transaction History</h2>
      <div className={styles.txnList}>
        {(txns?.data ?? []).map((t) => (
          <div key={t.id} className={styles.txnRow}>
            <div>
              <p className={styles.txnType}>{t.type}</p>
              <p className={styles.txnDesc}>{t.description ?? '—'}</p>
            </div>
            <div className={styles.txnRight}>
              <p className={styles.txnAmount} style={{ color: t.type === 'debit' ? '#ef4444' : '#22c55e' }}>
                {t.type === 'debit' ? '-' : '+'}₹{Number(t.amount).toFixed(2)}
              </p>
              <p className={styles.txnBalance}>Bal: ₹{Number(t.balanceAfter).toFixed(2)}</p>
            </div>
          </div>
        ))}
        {txns?.data?.length === 0 && <p className={styles.empty}>No transactions yet.</p>}
      </div>
    </div>
  );
}
