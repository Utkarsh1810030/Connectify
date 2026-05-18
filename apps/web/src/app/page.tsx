import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <span className={styles.logo}>Connectify</span>
        <div className={styles.navLinks}>
          <Link href="/pricing">Pricing</Link>
          <Link href="/home" className={styles.ctaNav}>Get Started</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Real conversations, <span>meaningful connections</span></h1>
        <p className={styles.heroSubtitle}>
          Connect with compassionate companions for chat, voice, and video sessions.
          Pay only for the time you use.
        </p>
        <div className={styles.heroCta}>
          <Link href="/home" className={styles.primaryBtn}>Browse Companions</Link>
          <Link href="/pricing" className={styles.secondaryBtn}>See Pricing</Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>💬</span>
          <h3>Chat</h3>
          <p>Text-based sessions with real-time messaging</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📞</span>
          <h3>Voice</h3>
          <p>Crystal-clear voice calls, no phone number needed</p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📹</span>
          <h3>Video</h3>
          <p>Face-to-face video sessions from anywhere</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 Connectify. All rights reserved.</p>
      </footer>
    </main>
  );
}
