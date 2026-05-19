'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from '../users/page.module.css';

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  completed: '#1d4ed8',
  pending: '#d97706',
  cancelled: '#dc2626',
  failed: '#dc2626',
  paused: '#7c3aed',
};

export default function AdminSessionsPage() {
  const { data } = useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: () => api.get('/admin/sessions').then(r => r.data),
  });

  return (
    <div>
      <h1 className={styles.title}>Sessions</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Type</th><th>Status</th><th>Rate/min</th>
            <th>Duration</th><th>Amount</th><th>Started At</th>
          </tr>
        </thead>
        <tbody>
          {(data?.data ?? []).map((s: any) => (
            <tr key={s.id}>
              <td><span className={styles.role}>{s.type}</span></td>
              <td>
                <span style={{ color: STATUS_COLORS[s.status] ?? '#374151', fontWeight: 600 }}>
                  {s.status}
                </span>
              </td>
              <td>₹{Number(s.ratePerMin).toFixed(2)}</td>
              <td>{s.totalDurationSec ? `${Math.floor(s.totalDurationSec / 60)}m ${s.totalDurationSec % 60}s` : '—'}</td>
              <td>{s.totalAmount ? `₹${Number(s.totalAmount).toFixed(2)}` : '—'}</td>
              <td>{s.startedAt ? new Date(s.startedAt).toLocaleString('en-IN') : '—'}</td>
            </tr>
          ))}
          {!data?.data?.length && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No sessions yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
