'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';
import type { Session } from '@connectify/types';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: session, isLoading, refetch } = useQuery<Session>({
    queryKey: ['session', id],
    queryFn: () => api.get(`/sessions/${id}`).then(r => r.data),
    refetchInterval: (query) => query.state.data?.status === 'active' ? 10000 : false,
  });

  const endSession = useMutation({
    mutationFn: () => api.post(`/sessions/${id}/end`),
    onSuccess: () => refetch(),
  });

  if (isLoading) return <div className={styles.state}>Loading session...</div>;
  if (!session) return <div className={styles.state}>Session not found.</div>;

  const isActive = session.status === 'active';
  const isDone = ['completed', 'cancelled', 'failed'].includes(session.status);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.type}>{session.type === 'chat' ? '💬' : session.type === 'voice' ? '📞' : '🎥'} {session.type}</span>
        <span className={styles.status} data-status={session.status}>{session.status}</span>
      </div>

      <div className={styles.info}>
        <div className={styles.infoRow}>
          <span>Rate</span><strong>₹{Number(session.ratePerMin).toFixed(2)}/min</strong>
        </div>
        {session.totalDurationSec > 0 && (
          <div className={styles.infoRow}>
            <span>Duration</span><strong>{formatDuration(session.totalDurationSec)}</strong>
          </div>
        )}
        {session.totalAmount > 0 && (
          <div className={styles.infoRow}>
            <span>Total charged</span><strong>₹{Number(session.totalAmount).toFixed(2)}</strong>
          </div>
        )}
        {session.endReason && (
          <div className={styles.infoRow}>
            <span>End reason</span><strong>{session.endReason.replace(/_/g, ' ')}</strong>
          </div>
        )}
      </div>

      {isActive && (
        <div className={styles.chatNotice}>
          {session.type === 'chat'
            ? 'Chat interface is handled in the mobile app. Session is active and billing is running.'
            : `${session.type === 'voice' ? 'Voice' : 'Video'} call is in progress via Agora. Use the mobile app for the full experience.`
          }
        </div>
      )}

      {isDone && (
        <div className={styles.done}>
          Session ended.
          <button className={styles.homeBtn} onClick={() => router.push('/home')}>
            Back to Home
          </button>
        </div>
      )}

      {isActive && (
        <button
          className={styles.endBtn}
          disabled={endSession.isPending}
          onClick={() => endSession.mutate()}
        >
          {endSession.isPending ? 'Ending...' : 'End Session'}
        </button>
      )}
    </div>
  );
}
