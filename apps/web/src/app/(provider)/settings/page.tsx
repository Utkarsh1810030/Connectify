'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import styles from './page.module.css';

const CATEGORIES = [
  'emotional_support', 'career_advice', 'relationship_advice',
  'life_coaching', 'language_practice', 'general_chat',
];

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati'];

export default function ProviderSettingsPage() {
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['provider-me'],
    queryFn: () => api.get('/providers/me').then(r => r.data),
  });

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    chatRatePerMin: '',
    voiceRatePerMin: '',
    videoRatePerMin: '',
    languages: [] as string[],
    categories: [] as string[],
  });

  const [isOnline, setIsOnline] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      displayName: profile.displayName ?? '',
      bio: profile.bio ?? '',
      chatRatePerMin: String(profile.chatRatePerMin ?? ''),
      voiceRatePerMin: String(profile.voiceRatePerMin ?? ''),
      videoRatePerMin: String(profile.videoRatePerMin ?? ''),
      languages: profile.languages ?? [],
      categories: profile.categories ?? [],
    });
    setIsOnline(profile.isOnline ?? false);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: () => api.patch('/providers/profile', {
      displayName: form.displayName,
      bio: form.bio || undefined,
      chatRatePerMin: parseFloat(form.chatRatePerMin),
      voiceRatePerMin: parseFloat(form.voiceRatePerMin),
      videoRatePerMin: parseFloat(form.videoRatePerMin),
      languages: form.languages,
      categories: form.categories,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleOnline = useMutation({
    mutationFn: (val: boolean) => api.patch('/providers/online', { isOnline: val }),
    onSuccess: (_, val) => {
      setIsOnline(val);
      qc.invalidateQueries({ queryKey: ['provider-me'] });
    },
  });

  function toggleMulti(key: 'languages' | 'categories', val: string) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  }

  if (isLoading) return <div className={styles.state}>Loading...</div>;
  if (!profile) return <div className={styles.state}>No provider profile found.</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <div className={styles.onlineRow}>
          <span className={styles.onlineLabel}>Status:</span>
          <button
            className={`${styles.onlineBtn} ${isOnline ? styles.online : styles.offline}`}
            onClick={() => toggleOnline.mutate(!isOnline)}
            disabled={toggleOnline.isPending}
          >
            {isOnline ? '🟢 Online' : '⚫ Offline'}
          </button>
        </div>
      </div>

      <form className={styles.form} onSubmit={e => { e.preventDefault(); updateProfile.mutate(); }}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <label className={styles.label}>
            Display Name
            <input
              className={styles.input}
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              required
            />
          </label>
          <label className={styles.label}>
            Bio
            <textarea
              className={styles.textarea}
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="Tell users about yourself..."
            />
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rates (₹/min)</h2>
          <div className={styles.ratesGrid}>
            {(['chatRatePerMin', 'voiceRatePerMin', 'videoRatePerMin'] as const).map(key => (
              <label key={key} className={styles.label}>
                {key === 'chatRatePerMin' ? '💬 Chat' : key === 'voiceRatePerMin' ? '📞 Voice' : '🎥 Video'}
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  step="0.5"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                />
              </label>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Languages</h2>
          <div className={styles.chips}>
            {LANGUAGES.map(l => (
              <button
                key={l}
                type="button"
                className={`${styles.chip} ${form.languages.includes(l) ? styles.chipActive : ''}`}
                onClick={() => toggleMulti('languages', l)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Categories</h2>
          <div className={styles.chips}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                className={`${styles.chip} ${form.categories.includes(c) ? styles.chipActive : ''}`}
                onClick={() => toggleMulti('categories', c)}
              >
                {c.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </section>

        <button
          type="submit"
          className={styles.saveBtn}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
        {updateProfile.isError && (
          <p className={styles.error}>Failed to save. Please try again.</p>
        )}
      </form>
    </div>
  );
}
