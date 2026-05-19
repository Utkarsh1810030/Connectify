'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';
import type { ProviderProfile, SessionType } from '@connectify/types';

const SESSION_LABELS: Record<SessionType, string> = {
  chat: '💬 Chat',
  voice: '📞 Voice Call',
  video: '🎥 Video Call',
};

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: provider, isLoading, isError } = useQuery<ProviderProfile>({
    queryKey: ['provider', id],
    queryFn: () => api.get(`/providers/${id}`).then(r => r.data),
  });

  const startSession = useMutation({
    mutationFn: async (type: SessionType) => {
      const { data: session } = await api.post('/sessions', { providerId: id, type });
      await api.post(`/sessions/${session.id}/start`);
      return session.id;
    },
    onSuccess: (sessionId) => router.push(`/session/${sessionId}`),
    onError: (err: any) => alert(err.response?.data?.message ?? 'Failed to start session'),
  });

  if (isLoading) return <div className={styles.state}>Loading...</div>;
  if (isError || !provider) return <div className={styles.state}>Provider not found.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{provider.displayName[0]}</div>
        <div>
          <h1 className={styles.name}>{provider.displayName}</h1>
          <span className={styles.badge} style={{ background: provider.isOnline ? '#22c55e' : '#9ca3af' }}>
            {provider.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {provider.bio && <p className={styles.bio}>{provider.bio}</p>}

      <div className={styles.meta}>
        <span>★ {Number(provider.avgRating).toFixed(1)}</span>
        <span>{provider.totalSessions} sessions</span>
        <span>{provider.languages.join(', ')}</span>
      </div>

      {provider.categories.length > 0 && (
        <div className={styles.tags}>
          {provider.categories.map(c => (
            <span key={c} className={styles.tag}>{c.replace(/_/g, ' ')}</span>
          ))}
        </div>
      )}

      <div className={styles.rates}>
        <h2 className={styles.ratesTitle}>Rates (per minute)</h2>
        <div className={styles.rateGrid}>
          <div className={styles.rateItem}><span>💬 Chat</span><strong>₹{provider.chatRatePerMin}</strong></div>
          <div className={styles.rateItem}><span>📞 Voice</span><strong>₹{provider.voiceRatePerMin}</strong></div>
          <div className={styles.rateItem}><span>🎥 Video</span><strong>₹{provider.videoRatePerMin}</strong></div>
        </div>
      </div>

      {provider.isOnline ? (
        <div className={styles.actions}>
          {(['chat', 'voice', 'video'] as SessionType[]).map(type => (
            <button
              key={type}
              className={styles.btn}
              disabled={startSession.isPending}
              onClick={() => startSession.mutate(type)}
            >
              {startSession.isPending ? 'Starting...' : SESSION_LABELS[type]}
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.offline}>This provider is currently offline.</p>
      )}
    </div>
  );
}
