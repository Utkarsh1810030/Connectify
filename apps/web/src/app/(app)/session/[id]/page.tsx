'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import type { Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { createChatSocket, getUserIdFromToken } from '@/lib/socket';
import styles from './page.module.css';
import type { Session } from '@connectify/types';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// ─── Rating Form ────────────────────────────────────────────────────────────

function RatingForm({ sessionId }: { sessionId: string }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/ratings/session/${sessionId}`).then(r => { if (r.data) setDone(true); }).catch(() => {});
  }, [sessionId]);

  async function submit() {
    if (!score) return;
    setLoading(true);
    try {
      await api.post('/ratings', { sessionId, score, comment: comment || undefined });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <p className={styles.ratedText}>★ Thanks for rating!</p>;

  return (
    <div className={styles.ratingForm}>
      <h3 className={styles.ratingTitle}>How was your session?</h3>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} className={`${styles.star} ${score >= n ? styles.starActive : ''}`} onClick={() => setScore(n)}>★</button>
        ))}
      </div>
      <textarea
        className={styles.ratingComment}
        placeholder="Leave a comment (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
      />
      <button className={styles.submitRating} disabled={!score || loading} onClick={submit}>
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
}

// ─── Chat Room ───────────────────────────────────────────────────────────────

function ChatRoom({ session }: { session: Session }) {
  const userId = getUserIdFromToken();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let socket: Socket;

    async function init() {
      const { data: conv } = await api.post('/chat/conversations', { sessionId: session.id });
      const convId: string = conv._id;
      setConversationId(convId);

      const { data: msgs } = await api.get(`/chat/messages/${convId}`);
      setMessages(msgs.data ?? []);

      socket = createChatSocket();
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join_conversation', { conversationId: convId });
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('new_message', (msg: any) => setMessages(prev => [...prev, msg]));
      socket.on('typing', ({ userId: uid, isTyping }: any) => {
        if (uid !== userId) setPartnerTyping(isTyping);
      });

      socket.connect();
    }

    init();
    return () => { socket?.disconnect(); };
  }, [session.id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  function sendMessage() {
    if (!input.trim() || !conversationId || !socketRef.current) return;
    socketRef.current.emit('send_message', {
      conversationId,
      sessionId: session.id,
      content: input.trim(),
      type: 'text',
    });
    setInput('');
  }

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('typing', { conversationId, isTyping });
  }, [conversationId]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    emitTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(false), 1000);
  }

  return (
    <div className={styles.chatRoom}>
      <div className={styles.chatStatus}>
        <span className={`${styles.dot} ${connected ? styles.dotOnline : styles.dotOffline}`} />
        {connected ? 'Connected' : 'Connecting...'}
      </div>
      <div className={styles.chatMessages}>
        {messages.map((m: any) => (
          <div key={m._id} className={`${styles.bubble} ${m.senderId === userId ? styles.mine : styles.theirs}`}>
            <p className={styles.bubbleText}>{m.content}</p>
          </div>
        ))}
        {partnerTyping && <p className={styles.typingIndicator}>Typing...</p>}
        <div ref={bottomRef} />
      </div>
      <div className={styles.chatInputRow}>
        <input
          className={styles.chatInput}
          placeholder="Type a message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={!connected}
        />
        <button className={styles.sendBtn} onClick={sendMessage} disabled={!connected || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: session, isLoading, refetch } = useQuery<Session>({
    queryKey: ['session', id],
    queryFn: () => api.get(`/sessions/${id}`).then(r => r.data),
    refetchInterval: q => q.state.data?.status === 'active' ? 10000 : false,
  });

  const endSession = useMutation({
    mutationFn: () => api.post(`/sessions/${id}/end`),
    onSuccess: () => refetch(),
  });

  if (isLoading) return <div className={styles.state}>Loading session...</div>;
  if (!session) return <div className={styles.state}>Session not found.</div>;

  const isActive = session.status === 'active';
  const isDone = ['completed', 'cancelled', 'failed'].includes(session.status);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.type}>
          {session.type === 'chat' ? '💬' : session.type === 'voice' ? '📞' : '🎥'} {session.type}
        </span>
        <span className={styles.status} data-status={session.status}>{session.status}</span>
      </div>

      <div className={styles.info}>
        <div className={styles.infoRow}><span>Rate</span><strong>₹{Number(session.ratePerMin).toFixed(2)}/min</strong></div>
        {session.totalDurationSec > 0 && (
          <div className={styles.infoRow}><span>Duration</span><strong>{formatDuration(session.totalDurationSec)}</strong></div>
        )}
        {session.totalAmount > 0 && (
          <div className={styles.infoRow}><span>Total charged</span><strong>₹{Number(session.totalAmount).toFixed(2)}</strong></div>
        )}
        {session.endReason && (
          <div className={styles.infoRow}><span>End reason</span><strong>{session.endReason.replace(/_/g, ' ')}</strong></div>
        )}
      </div>

      {isActive && session.type === 'chat' && <ChatRoom session={session} />}

      {isActive && session.type !== 'chat' && (
        <div className={styles.callNotice}>
          {session.type === 'voice' ? '📞' : '🎥'} {session.type === 'voice' ? 'Voice' : 'Video'} call active via Agora.
          Use the mobile app for the full call experience.
        </div>
      )}

      {isActive && (
        <button
          className={styles.endBtn}
          disabled={endSession.isPending}
          onClick={() => endSession.mutate()}
        >
          {endSession.isPending ? 'Ending...' : 'End Session'}
        </button>
      )}

      {isDone && (
        <>
          <RatingForm sessionId={id} />
          <button className={styles.homeBtn} onClick={() => router.push('/home')}>
            Back to Home
          </button>
        </>
      )}
    </div>
  );
}
