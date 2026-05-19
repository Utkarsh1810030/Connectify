'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.logo}>Provider Hub</Link>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navItem}>📊 Dashboard</Link>
          <Link href="/earnings" className={styles.navItem}>💰 Earnings</Link>
          <Link href="/home" className={styles.navItem}>🏠 Browse</Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
