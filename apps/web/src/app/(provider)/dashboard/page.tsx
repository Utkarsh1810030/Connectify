'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';
import type { ProviderProfile } from '@connectify/types';

const KYC_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  not_submitted: { label: 'KYC Not Submitted', bg: '#f3f4f6', color: '#6b7280' },
  pending: { label: 'KYC Pending Review', bg: '#fef3c7', color: '#d97706' },
  approved: { label: 'KYC Verified', bg: '#dcfce7', color: '#16a34a' },
  rejected: { label: 'KYC Rejected', bg: '#fee2e2', color: '#dc2626' },
};

export default function ProviderDashboardPage() {
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery<ProviderProfile>({
    queryKey: ['provider', 'me'],
    queryFn: () => api.get('/providers/me').then(r => r.data),
  });

  const { data: kyc } = useQuery({
    queryKey: ['kyc', 'me'],
    queryFn: () => api.get('/providers/kyc').then(r => r.data),
    enabled: !!profile,
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'as-provider'],
    queryFn: () => api.get('/sessions/as-provider?limit=5').then(r => r.data),
    refetchInterval: 15000,
  });

  const toggleOnline = useMutation({
    mutationFn: (isOnline: boolean) => api.patch('/providers/online', { isOnline }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provider', 'me'] }),
  });

  const acceptSession = useMutation({
    mutationFn: (id: string) => api.post(`/sessions/${id}/accept`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', 'as-provider'] }),
  });

  const declineSession = useMutation({
    mutationFn: (id: string) => api.post(`/sessions/${id}/decline`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', 'as-provider'] }),
  });

  if (isLoading) return <div className={styles.state}>Loading...</div>;
  if (!profile) return (
    <div className={styles.state}>
      <p>You don&apos;t have a provider profile yet.</p>
      <Link href="/provider/settings" className={styles.setupBtn}>Set up profile</Link>
    </div>
  );

  const allSessions: any[] = sessions?.data ?? [];
  const pendingSessions = allSessions.filter((s: any) => s.status === 'pending');
  const recentSessions = allSessions.filter((s: any) => s.status !== 'pending').slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>{profile.displayName}</h1>
          <span className={styles.badge} style={{ background: profile.isOnline ? '#dcfce7' : '#f3f4f6', color: profile.isOnline ? '#16a34a' : '#6b7280' }}>
            {profile.isOnline ? 'Online' : 'Offline'}
          </span>
          {!profile.isApproved && <span className={styles.pendingBadge}>Pending approval</span>}
          {kyc?.kycStatus && KYC_BADGE[kyc.kycStatus] && (
            <span
              className={styles.kycBadge}
              style={{ background: KYC_BADGE[kyc.kycStatus].bg, color: KYC_BADGE[kyc.kycStatus].color }}
            >
              {KYC_BADGE[kyc.kycStatus].label}
            </span>
          )}
        </div>
        <button
          className={profile.isOnline ? styles.goOfflineBtn : styles.goOnlineBtn}
          disabled={toggleOnline.isPending}
          onClick={() => toggleOnline.mutate(!profile.isOnline)}
        >
          {toggleOnline.isPending ? '...' : profile.isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {pendingSessions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Incoming Requests <span className={styles.requestCount}>{pendingSessions.length}</span></h2>
          </div>
          {pendingSessions.map((s: any) => (
            <div key={s.id} className={styles.requestRow}>
              <div>
                <span className={styles.sessionType}>{s.type}</span>
                <span className={styles.sessionRate}> · ₹{Number(s.ratePerMin).toFixed(0)}/min</span>
              </div>
              <div className={styles.requestActions}>
                <button
                  className={styles.acceptBtn}
                  disabled={acceptSession.isPending}
                  onClick={() => acceptSession.mutate(s.id)}
                >Accept</button>
                <button
                  className={styles.declineBtn}
                  disabled={declineSession.isPending}
                  onClick={() => declineSession.mutate(s.id)}
                >Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Sessions</p>
          <p className={styles.statValue}>{profile.totalSessions}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Minutes</p>
          <p className={styles.statValue}>{profile.totalMinutes}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Avg Rating</p>
          <p className={styles.statValue}>★ {Number(profile.avgRating).toFixed(1)}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Chat Rate</p>
          <p className={styles.statValue}>₹{profile.chatRatePerMin}/min</p>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Sessions</h2>
          <Link href="/earnings" className={styles.viewAll}>View earnings →</Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className={styles.empty}>No sessions yet.</p>
        ) : (
          recentSessions.map((s: any) => (
            <div key={s.id} className={styles.sessionRow}>
              <span className={styles.sessionType}>{s.type}</span>
              <span>{s.totalDurationSec ? `${Math.floor(s.totalDurationSec / 60)}m` : '—'}</span>
              <span className={styles.earning}>+₹{Number(s.providerEarning ?? 0).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
