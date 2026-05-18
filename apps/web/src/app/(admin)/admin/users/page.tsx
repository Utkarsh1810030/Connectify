'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      api.post(`/admin/users/${id}/${ban ? 'ban' : 'unban'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div>
      <h1 className={styles.title}>Users</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Phone</th><th>Name</th><th>Role</th><th>Verified</th><th>Banned</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data?.data ?? []).map((u: any) => (
            <tr key={u.id}>
              <td>{u.phone}</td>
              <td>{u.name ?? '—'}</td>
              <td><span className={styles.role}>{u.role}</span></td>
              <td>{u.isVerified ? '✅' : '—'}</td>
              <td>{u.isBanned ? '🚫' : '—'}</td>
              <td>
                <button
                  className={u.isBanned ? styles.unbanBtn : styles.banBtn}
                  onClick={() => banMutation.mutate({ id: u.id, ban: !u.isBanned })}
                >
                  {u.isBanned ? 'Unban' : 'Ban'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
