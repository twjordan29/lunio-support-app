import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/src/components/AppHeader';
import { MessageBubble } from '@/src/components/MessageBubble';
import { Toast } from '@/src/components/Toast';
import { closeConversation, completeConversation, getConversationMessages, reopenConversation, sendMessage } from '@/src/api/supportApi';
import { useAuth } from '@/src/auth/AuthContext';
import type { SupportMessage } from '@/src/types/support';

export function ConversationThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string>('open'); // Assume open, or fetch
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId) return;
    getConversationMessages(conversationId).then(setMessages).catch(() => setMessages([]));
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  }, [messages]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !conversationId || isSending) return;

    setIsSending(true);
    try {
      const msg = await sendMessage(conversationId, body);
      setMessages((prev) => [...prev, msg]);
      setDraft('');
    } catch {
      // Handle error silently for now
    } finally {
      setIsSending(false);
    }
  };

  useSupportSocket(token, {
    onMessageCreated: (payload: { conversation_id: number; message: SupportMessage }) => {
      const { conversation_id, message } = payload;
      const senderId = message.sender_id;

      // Only add if this conversation
      if (conversation_id === conversationId && senderId !== user?.id) {
        setMessages((prev) => [...prev, message]);
        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

        // Vibrate
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const customerName = messages.find(m => m.sender_type !== 'staff')?.sender_id || 'Customer';

  const handleClose = () => {
    Alert.alert(
      'Close Conversation',
      'Are you sure you want to close this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeConversation(conversationId);
              setStatus('closed');
              Alert.alert('Success', 'Conversation closed.');
              router.back(); // Go back to list
            } catch {
              Alert.alert('Error', 'Failed to close conversation.');
            }
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Alert.alert(
      'Complete Conversation',
      'Mark this conversation as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeConversation(conversationId);
              setStatus('resolved');
              Alert.alert('Success', 'Conversation marked as resolved.');
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to complete conversation.');
            }
          },
        },
      ]
    );
  };

  const handleReopen = () => {
    Alert.alert(
      'Reopen Conversation',
      'Reopen this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              await reopenConversation(conversationId);
              setStatus('open');
              Alert.alert('Success', 'Conversation reopened.');
            } catch {
              Alert.alert('Error', 'Failed to reopen conversation.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    // TODO: Implement conversation deletion when support-api adds DELETE /api/conversations/:id endpoint
    // For now, this is a placeholder. Backend should enforce admin-only access.
    Alert.alert('Not Implemented', 'Conversation deletion is not yet supported. Add DELETE endpoint to support-api first.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={`Chat with ${customerName}`}
        onBack={() => router.back()}
      />

      {user?.role === 'admin' || user?.role === 'support' ? (
        <View style={styles.actions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsContainer}>
            {status === 'open' && (
              <>
                <Pressable style={[styles.actionButton, styles.completeButton]} onPress={handleComplete}>
                  <Text style={styles.actionText}>Complete</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.closeButton]} onPress={handleClose}>
                  <Text style={styles.actionText}>Close</Text>
                </Pressable>
              </>
            )}
            {status !== 'open' && (
              <Pressable style={[styles.actionButton, styles.reopenButton]} onPress={handleReopen}>
                <Text style={styles.actionText}>Reopen</Text>
              </Pressable>
            )}
            <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          style={styles.list}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MessageBubble
              message={item.body}
              isFromUser={item.sender_type === 'staff'}
              timestamp={item.created_at}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]} // Extra for composer height
        />

        <View style={[styles.composer, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            placeholderTextColor="#94a3b8"
          />
          <Pressable
            style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={!draft.trim() || isSending}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Toast
        message={toastMessage || ''}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  closeButton: {
    backgroundColor: '#f59e0b',
  },
  reopenButton: {
    backgroundColor: '#2563eb',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
