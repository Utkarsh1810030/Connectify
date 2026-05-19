'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './page.module.css';
import type { Wallet, Transaction } from '@connectify/types';

const TOPUP_AMOUNTS = [100, 200, 500, 1000];

function TopupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalAmount = custom ? parseInt(custom, 10) : amount;

  async function handleTopup() {
    if (!finalAmount || finalAmount < 100) {
      setError('Minimum top-up is ₹100');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data: order } = await api.post('/billing/topup/order', { amount: finalAmount });

      // Dynamically load Razorpay checkout script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      await new Promise<void>((resolve) => { script.onload = () => resolve(); });

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
        amount: finalAmount * 100,
        currency: 'INR',
        name: 'Connectify',
        description: 'Wallet Top-up',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.post('/billing/topup/verify', {
              orderId: order.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: finalAmount,
            });
            onSuccess();
            onClose();
          } catch {
            setError('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to initiate payment');
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Add Money</h2>
        <div className={styles.amountGrid}>
          {TOPUP_AMOUNTS.map((a) => (
            <button
              key={a}
              className={`${styles.amountChip} ${amount === a && !custom ? styles.amountChipActive : ''}`}
              onClick={() => { setAmount(a); setCustom(''); }}
            >
              ₹{a}
            </button>
          ))}
        </div>
        <input
          className={styles.customInput}
          type="number"
          placeholder="Custom amount"
          min={100}
          value={custom}
          onChange={(e) => { setCustom(e.target.value); }}
        />
        {error && <p className={styles.modalError}>{error}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.payBtn} onClick={handleTopup} disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${finalAmount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [showTopup, setShowTopup] = useState(false);
  const qc = useQueryClient();

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
        <button className={styles.topupBtn} onClick={() => setShowTopup(true)}>Add Money</button>
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

      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['wallet'] });
            qc.invalidateQueries({ queryKey: ['transactions'] });
          }}
        />
      )}
    </div>
  );
}
