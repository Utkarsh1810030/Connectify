'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from '../users/page.module.css';

export default function AdminPayoutsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'payouts'],
    queryFn: () => api.get('/admin/payouts').then(r => r.data),
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/payouts/${id}/process`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'payouts'] }),
  });

  return (
    <div>
      <h1 className={styles.title}>Payouts</h1>
      <table className={styles.table}>
        <thead>
          <tr><th>Provider</th><th>Amount</th><th>Status</th><th>Requested</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {(data?.data ?? []).map((p: any) => (
            <tr key={p.id}>
              <td>{p.providerId}</td>
              <td>₹{Number(p.amount).toFixed(2)}</td>
              <td><span className={styles.role}>{p.status}</span></td>
              <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
              <td>
                {p.status === 'pending' && (
                  <button className={styles.unbanBtn} onClick={() => processMutation.mutate(p.id)}>
                    Process
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
