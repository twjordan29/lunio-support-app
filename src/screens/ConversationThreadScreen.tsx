import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getConversationMessages, sendMessage } from '@/src/api/supportApi';
import type { SupportMessage } from '@/src/types/support';

export function ConversationThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!conversationId) return;
    getConversationMessages(conversationId).then(setMessages).catch(() => setMessages([]));
  }, [conversationId]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !conversationId) return;
    const msg = await sendMessage(conversationId, body);
    setMessages((prev) => [...prev, msg]);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <View style={[styles.bubble, item.sender_type === 'staff' ? styles.staff : styles.guest]}><Text>{item.body}</Text></View>}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Reply..." value={draft} onChangeText={setDraft} />
        <Pressable style={styles.send} onPress={onSend}><Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f1f5f9' }, list: { flex: 1, padding: 12 }, bubble: { maxWidth: '84%', padding: 10, borderRadius: 12, marginBottom: 8 }, staff: { alignSelf: 'flex-end', backgroundColor: '#dbeafe' }, guest: { alignSelf: 'flex-start', backgroundColor: '#fff' }, inputRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#cbd5e1', padding: 10, backgroundColor: '#fff' }, input: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, marginRight: 8 }, send: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' } });
