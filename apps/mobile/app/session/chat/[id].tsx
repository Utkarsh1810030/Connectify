import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSessionStore } from '@/stores/session.store';
import { socketService } from '@/services/socket';
import { api } from '@/services/api';
import type { Message } from '@connectify/types';

export default function ChatSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeSession, endSession } = useSessionStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    socketService.joinConversation(id);
    socketService.onNewMessage((msg) => {
      setMessages(prev => [...prev, msg]);
      listRef.current?.scrollToEnd({ animated: true });
    });
    socketService.onSessionEnd(() => handleEnd(false));
    socketService.onLowBalance(() => {
      Alert.alert('Low Balance', 'Your wallet balance is running low. Add money to continue.');
    });

    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => {
      clearInterval(timer);
      socketService.leaveConversation(id);
    };
  }, [id]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    socketService.sendMessage(id, text);
    setInput('');
  };

  const handleEnd = useCallback(async (userInitiated = true) => {
    if (userInitiated) {
      await api.post(`/sessions/${id}/end`).catch(() => {});
    }
    endSession();
    router.replace('/(modals)/rate');
  }, [id, endSession]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('End Session?', 'This will end the session and charge you for the time used.', [
          { text: 'End', style: 'destructive', onPress: () => handleEnd(true) },
          { text: 'Cancel', style: 'cancel' },
        ])}>
          <Text style={styles.endBtn}>End</Text>
        </TouchableOpacity>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderId === activeSession?.userId ? styles.mine : styles.theirs]}>
            <Text style={[styles.bubbleText, item.senderId === activeSession?.userId && styles.mineText]}>
              {item.content}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!input.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  endBtn: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
  timer: { fontSize: 18, fontWeight: '700', color: '#6C63FF', fontVariant: ['tabular-nums'] },
  messageList: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  mine: { alignSelf: 'flex-end', backgroundColor: '#6C63FF' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  bubbleText: { fontSize: 15, color: '#333', lineHeight: 20 },
  mineText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: '#6C63FF', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
});
