'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';
import type { ProviderListItem } from '@connectify/types';

function ProviderCard({ p }: { p: ProviderListItem }) {
  return (
    <Link href={`/provider/${p.id}`} className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.avatar}>{p.displayName[0]}</div>
        <div className={styles.dot} style={{ background: p.isOnline ? '#22c55e' : '#d1d5db' }} />
      </div>
      <h3 className={styles.name}>{p.displayName}</h3>
      <p className={styles.bio}>{p.bio ?? 'No bio yet'}</p>
      <div className={styles.meta}>
        <span className={styles.rate}>₹{p.chatRatePerMin}/min</span>
        <span className={styles.rating}>★ {Number(p.avgRating).toFixed(1)}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get('/providers').then(r => r.data),
  });

  return (
    <div>
      <h1 className={styles.title}>Find a Companion</h1>
      {isLoading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.grid}>
          {(data?.data ?? []).map((p: ProviderListItem) => <ProviderCard key={p.id} p={p} />)}
          {data?.data?.length === 0 && <p className={styles.empty}>No companions available right now.</p>}
        </div>
      )}
    </div>
  );
}
