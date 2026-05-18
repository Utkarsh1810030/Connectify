'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from '../users/page.module.css';

export default function AdminModerationPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get('/admin/reports').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/reports/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return (
    <div>
      <h1 className={styles.title}>Moderation Reports</h1>
      <table className={styles.table}>
        <thead>
          <tr><th>Reporter</th><th>Reported</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {(data?.data ?? []).map((r: any) => (
            <tr key={r.id}>
              <td>{r.reporterId}</td>
              <td>{r.reportedUserId}</td>
              <td>{r.reason}</td>
              <td><span className={styles.role}>{r.status}</span></td>
              <td>
                {r.status === 'open' && (
                  <>
                    <button className={styles.unbanBtn} onClick={() => updateMutation.mutate({ id: r.id, status: 'resolved' })}>Resolve</button>
                    {' '}
                    <button className={styles.banBtn} onClick={() => updateMutation.mutate({ id: r.id, status: 'dismissed' })}>Dismiss</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
