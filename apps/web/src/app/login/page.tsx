'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      router.replace('/home');
    }
  }, [router]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp });
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      router.replace('/home');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Connectify</h1>
        <p className={styles.sub}>Sign in to continue</p>

        {step === 'phone' ? (
          <form onSubmit={requestOtp} className={styles.form}>
            <label className={styles.label}>Mobile Number</label>
            <input
              className={styles.input}
              type="tel"
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.btn} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className={styles.form}>
            <label className={styles.label}>Enter OTP sent to {phone}</label>
            <input
              className={styles.input}
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.btn} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className={styles.back}
              onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
