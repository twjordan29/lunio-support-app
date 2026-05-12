import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { closeConversation, completeConversation, getConversation, getConversationMessages, reopenConversation, sendMessage } from '@/src/api/supportApi';
import { useAuth } from '@/src/auth/AuthContext';
import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingState } from '@/src/components/LoadingState';
import { MessageBubble } from '@/src/components/MessageBubble';
import { useNotificationPreferences } from '@/src/hooks/useNotificationPreferences';
import { useSupportSocket } from '@/src/hooks/useSupportSocket';
import type { Conversation, ConversationStatus, SupportMessage } from '@/src/types/support';
import { mergeUniqueMessages } from '@/src/utils/merge';

export function ConversationThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();
  const { preferences } = useNotificationPreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string>('open');
  const flatListRef = useRef<FlatList>(null);
  const pendingMessageCounter = useRef(0);

  useEffect(() => {
    if (!conversationId || isNaN(conversationId)) return;
    Promise.all([
      getConversation(conversationId).then(setConversation).catch(() => setConversation(null)),
      getConversationMessages(conversationId)
        .then((messages) => setMessages((prev) => mergeUniqueMessages(prev, messages)))
        .catch(() => setMessages([])),
    ]);
  }, [conversationId]);

  useEffect(() => {
    if (conversation?.status) {
      setStatus(conversation.status);
    }
  }, [conversation?.status]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  }, [messages]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !conversationId || isNaN(conversationId) || isSending) return;

    const pendingId = `pending:${pendingMessageCounter.current + 1}`;
    pendingMessageCounter.current += 1;

    const optimisticMessage: SupportMessage = {
      id: -pendingMessageCounter.current,
      conversation_id: conversationId,
      sender_type: user?.role === 'admin' || user?.role === 'support' ? 'staff' : 'user',
      sender_id: user?.id ?? null,
      body,
      created_at: new Date().toISOString(),
      local_id: pendingId,
    };

    setMessages((prev) => mergeUniqueMessages(prev, [optimisticMessage]));
    setDraft('');
    setIsSending(true);

    try {
      const msg = await sendMessage(conversationId, body);
      setMessages((prev) => mergeUniqueMessages(prev.filter((message) => message.local_id !== pendingId), [msg]));
    } catch {
      setMessages((prev) => prev.filter((message) => message.local_id !== pendingId));
    } finally {
      setIsSending(false);
    }
  };

  useSupportSocket(token, {
    onAuthError: async () => {
      console.debug('[thread] auth error, logging out');
      await logout();
      router.replace('/login');
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
    },
    onMessageCreated: (payload: { conversation_id: number; message: SupportMessage }) => {
      const { conversation_id, message } = payload;
      const senderId = message.sender_id;

      // Only add if this conversation and not own message
      if (conversation_id === conversationId && senderId !== user?.id) {
        setMessages((prev) => mergeUniqueMessages(prev, [message]));
        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

        // Vibrate if enabled
        if (preferences.vibrationEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    },
    onConversationStatusChanged: (payload: { conversation_id: number; status: string; conversation: Conversation }) => {
      const { conversation_id, status } = payload;

      if (conversation_id === conversationId) {
        setConversation((prev: Conversation | null) => prev ? { ...prev, status: status as ConversationStatus } : null);
        if (status === 'closed') {
          Alert.alert('Conversation Closed', 'This conversation has been closed.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      }
    },
  });

  const customerName = conversation?.customer_name || messages.find(m => m.sender_type !== 'staff')?.sender_id || 'Customer';

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
              setConversation((prev: Conversation | null) => prev ? { ...prev, status: 'closed' } : null);
              Alert.alert('Success', 'Conversation closed.');
              router.back(); // Go back to list
            } catch (error: any) {
              const message = error?.response?.data?.error?.message || 'Failed to close conversation.';
              Alert.alert('Error', message);
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
              setConversation((prev: Conversation | null) => prev ? { ...prev, status: 'completed' } : null);
              Alert.alert('Success', 'Conversation marked as completed.');
              router.back();
            } catch (error: any) {
              const message = error?.response?.data?.error?.message || 'Failed to complete conversation.';
              Alert.alert('Error', message);
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
              setConversation((prev: Conversation | null) => prev ? { ...prev, status: 'open' } : null);
              Alert.alert('Success', 'Conversation reopened.');
            } catch (error: any) {
              const message = error?.response?.data?.error?.message || 'Failed to reopen conversation.';
              Alert.alert('Error', message);
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

  if (!user) {
    return <LoadingState message="Loading conversation..." />;
  }

  if (isNaN(conversationId) || conversationId <= 0) {
    return (
      <EmptyState
        title="Invalid Conversation"
        subtitle="The conversation ID is invalid."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={conversation?.subject || `Chat with ${customerName}`}
        subtitle={conversation?.customer_email || undefined}
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
          keyExtractor={(item) => item.local_id ?? String(item.id)}
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 12,
    fontSize: 16,
    color: '#0f172a',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
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
