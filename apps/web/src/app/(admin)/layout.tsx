import Link from 'next/link';
import styles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin/users" className={styles.logo}>Admin Panel</Link>
        <nav className={styles.nav}>
          <Link href="/admin/users" className={styles.navItem}>👥 Users</Link>
          <Link href="/admin/sessions" className={styles.navItem}>🔗 Sessions</Link>
          <Link href="/admin/payouts" className={styles.navItem}>💸 Payouts</Link>
          <Link href="/admin/moderation" className={styles.navItem}>🛡️ Moderation</Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
