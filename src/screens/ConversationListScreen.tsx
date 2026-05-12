import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getConversations } from '@/src/api/supportApi';
import { useAuth } from '@/src/auth/AuthContext';
import { useSupportSocket } from '@/src/hooks/useSupportSocket';
import type { Conversation } from '@/src/types/support';

export function ConversationListScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { isConnected } = useSupportSocket(token);
  const [items, setItems] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!token) return;
    getConversations().then(setItems).catch(() => setItems([]));
  }, [token]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent back button from exiting the app on conversation list
      return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Conversations {isConnected ? '• Live' : '• Offline'}</Text>
        <Pressable style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsText}>⚙️</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/conversations/${item.id}`)}>
            <View style={styles.row}><Text style={styles.name}>{item.customer_name || 'Unknown customer'}</Text><Text style={styles.status}>{item.status}</Text></View>
            <Text style={styles.email}>{item.customer_email || 'No email'}</Text>
            <View style={styles.row}><Text style={styles.badge}>{item.assigned_admin_id ? 'Mine/Assigned' : 'Unassigned'}</Text>{(item.unread_count ?? 0) > 0 ? <Text style={styles.unread}>{item.unread_count}</Text> : null}</View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 56, paddingHorizontal: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerText: { fontSize: 24, fontWeight: '700' },
  settingsButton: { padding: 8 },
  settingsText: { fontSize: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '700', color: '#0f172a' },
  status: { color: '#1d4ed8', textTransform: 'capitalize' },
  email: { color: '#64748b', marginTop: 6 },
  badge: { marginTop: 10, color: '#334155', backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  unread: { marginTop: 10, backgroundColor: '#ef4444', color: '#fff', minWidth: 24, textAlign: 'center', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '700' }
});
