import Link from 'next/link';
import styles from './page.module.css';

const TIERS = [
  {
    name: 'Pay As You Go',
    description: 'No subscription. Pay only for time used.',
    price: null,
    features: [
      'Chat sessions from ₹10/min',
      'Voice calls from ₹20/min',
      'Video calls from ₹30/min',
      'Wallet top-up from ₹100',
      'No expiry on wallet balance',
    ],
    cta: 'Get Started',
    href: '/home',
    highlight: true,
  },
  {
    name: 'For Providers',
    description: 'Set your own rates. Keep 85% of earnings.',
    price: null,
    features: [
      'Set your own per-minute rates',
      '85% earnings (15% platform fee)',
      'Weekly payout to bank account',
      'Free to register and get approved',
      'Dedicated provider dashboard',
    ],
    cta: 'Become a Provider',
    href: '/home',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Connectify</Link>
        <Link href="/home" className={styles.ctaNav}>Browse Companions</Link>
      </nav>

      <section className={styles.hero}>
        <h1 className={styles.title}>Simple, Transparent Pricing</h1>
        <p className={styles.subtitle}>
          Pay only for the time you spend. No hidden fees, no subscriptions.
        </p>
      </section>

      <div className={styles.grid}>
        {TIERS.map((tier) => (
          <div key={tier.name} className={`${styles.card} ${tier.highlight ? styles.highlight : ''}`}>
            <h2 className={styles.tierName}>{tier.name}</h2>
            <p className={styles.tierDesc}>{tier.description}</p>
            <ul className={styles.features}>
              {tier.features.map((f) => (
                <li key={f} className={styles.feature}>
                  <span className={styles.check}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href={tier.href} className={`${styles.cta} ${tier.highlight ? styles.ctaPrimary : styles.ctaSecondary}`}>
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <section className={styles.faq}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqItem}>
          <h3>How does billing work?</h3>
          <p>You add money to your wallet first. When you start a session, your wallet is charged every minute at the provider&apos;s rate. The session ends automatically if your balance runs low.</p>
        </div>
        <div className={styles.faqItem}>
          <h3>What is the minimum top-up?</h3>
          <p>You can add as little as ₹100 to your wallet. Balance never expires.</p>
        </div>
        <div className={styles.faqItem}>
          <h3>How do providers get paid?</h3>
          <p>Providers earn 85% of every session. Payouts are processed weekly to their registered bank account.</p>
        </div>
      </section>
    </main>
  );
}
