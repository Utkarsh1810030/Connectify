'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      router.replace('/login');
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.replace('/login');
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/home" className={styles.logo}>Connectify</Link>
        <nav className={styles.nav}>
          <Link href="/home" className={styles.navItem}>🏠 Home</Link>
          <Link href="/wallet" className={styles.navItem}>💰 Wallet</Link>
        </nav>
        <button onClick={handleLogout} className={styles.logoutBtn}>Sign out</button>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
