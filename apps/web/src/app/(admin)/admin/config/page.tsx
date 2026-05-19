'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function AdminConfigPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: configs, isLoading } = useQuery<any[]>({
    queryKey: ['admin', 'config'],
    queryFn: () => api.get('/admin/config').then(r => r.data),
  });

  const updateConfig = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      api.patch(`/admin/config/${key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'config'] });
      setEditing(null);
    },
  });

  function startEdit(key: string, value: any) {
    setEditing(key);
    setEditValue(typeof value === 'string' ? value : JSON.stringify(value));
  }

  function saveEdit(key: string) {
    let parsed: any;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      parsed = editValue;
    }
    updateConfig.mutate({ key, value: parsed });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Platform Config</h1>
        <p className={styles.pageDesc}>Runtime configuration values. Changes take effect immediately.</p>
      </div>

      {isLoading ? (
        <p className={styles.empty}>Loading...</p>
      ) : !configs?.length ? (
        <p className={styles.empty}>No config keys found. Seed them via DB migration or direct insert.</p>
      ) : (
        <div className={styles.configList}>
          {configs.map((c: any) => (
            <div key={c.key} className={styles.configRow}>
              <div className={styles.configMeta}>
                <span className={styles.configKey}>{c.key}</span>
                {c.description && <span className={styles.configDesc}>{c.description}</span>}
              </div>
              {editing === c.key ? (
                <div className={styles.editRow}>
                  <input
                    className={styles.editInput}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(c.key)}
                  />
                  <button className={styles.saveBtn} disabled={updateConfig.isPending} onClick={() => saveEdit(c.key)}>
                    Save
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <div className={styles.valueRow}>
                  <code className={styles.configValue}>
                    {typeof c.value === 'string' ? c.value : JSON.stringify(c.value)}
                  </code>
                  <button className={styles.editBtn} onClick={() => startEdit(c.key, c.value)}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
