import Link from 'next/link';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/home" className={styles.logo}>Connectify</Link>
        <nav className={styles.nav}>
          <Link href="/home" className={styles.navItem}>🏠 Home</Link>
          <Link href="/wallet" className={styles.navItem}>💰 Wallet</Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
