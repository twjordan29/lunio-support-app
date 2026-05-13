import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { closeConversation, completeConversation, getConversation, getConversationMessages, markConversationRead, reopenConversation, sendMessage } from '@/src/api/supportApi';
import { useAuth } from '@/src/auth/AuthContext';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingState } from '@/src/components/LoadingState';
import { MessageBubble } from '@/src/components/MessageBubble';
import { StatusBadge } from '@/src/components/StatusBadge';
import { colors, shadow } from '@/src/components/theme';
import { useNotificationPreferences } from '@/src/hooks/useNotificationPreferences';
import { useSupportSocket } from '@/src/hooks/useSupportSocket';
import type { Conversation, ConversationStatus, SupportMessage } from '@/src/types/support';
import { getConversationDisplayInfo, mergeConversationPreservingDisplay } from '@/src/utils/conversationDisplay';
import { mergeUniqueMessages } from '@/src/utils/merge';

const SUPPORT_APP_DEBUG = false;

export function ConversationThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();
  const { preferences } = useNotificationPreferences();
  const { id, conversation: conversationParam } = useLocalSearchParams<{ id: string; conversation?: string }>();
  const conversationId = Number(id);
  const initialConversation = useMemo(() => {
    if (!conversationParam) return null;
    try {
      const raw = Array.isArray(conversationParam) ? conversationParam[0] : conversationParam;
      return JSON.parse(raw) as Conversation;
    } catch {
      return null;
    }
  }, [conversationParam]);
  const [conversation, setConversation] = useState<Conversation | null>(initialConversation);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string>('open');
  const [notice, setNotice] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pendingMessageCounter = useRef(0);

  useEffect(() => {
    if (!conversationId || isNaN(conversationId)) return;
    Promise.all([
      getConversation(conversationId)
        .then((fetched) => setConversation((prev) => prev ? mergeConversationPreservingDisplay(prev, fetched) : fetched))
        .catch(() => setConversation((prev) => prev)),
      getConversationMessages(conversationId)
        .then((messages) => setMessages((prev) => mergeUniqueMessages(prev, messages)))
        .catch(() => setMessages([])),
    ]);
    markConversationRead(conversationId)
      .then(() => setConversation((prev) => prev ? mergeConversationPreservingDisplay(prev, { unread_count: 0 }) : prev))
      .catch(() => undefined);
  }, [conversationId]);

  useEffect(() => {
    if (conversation?.status) {
      setStatus(conversation.status);
    }
  }, [conversation?.status]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  }, [messages]);

  const isStaff = user?.role === 'admin' || user?.role === 'support';
  const isClosed = status !== 'open';
  const { displayName: customerName, displayEmail: customerEmail, displayNameSource, displayEmailSource } = getConversationDisplayInfo(conversation);

  useEffect(() => {
    if (!SUPPORT_APP_DEBUG) return;
    console.debug('[lunio-support] thread header display', {
      conversation_id: conversationId,
      displayNameSource,
      displayEmailSource,
      displayName: customerName,
      displayEmail: customerEmail,
    });
  }, [conversationId, customerEmail, customerName, displayEmailSource, displayNameSource]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !conversationId || isNaN(conversationId) || isSending || isClosed) return;

    const pendingId = `pending:${pendingMessageCounter.current + 1}`;
    pendingMessageCounter.current += 1;

    const optimisticMessage: SupportMessage = {
      id: -pendingMessageCounter.current,
      conversation_id: conversationId,
      sender_type: isStaff ? 'staff' : 'user',
      sender_id: user?.id ?? null,
      body,
      created_at: new Date().toISOString(),
      local_id: pendingId,
    };

    setMessages((prev) => mergeUniqueMessages(prev, [optimisticMessage]));
    setDraft('');
    setIsSending(true);
    setNotice(null);

    try {
      const msg = await sendMessage(conversationId, body);
      setMessages((prev) => mergeUniqueMessages(prev.filter((message) => message.local_id !== pendingId), [msg]));
    } catch {
      setMessages((prev) => prev.filter((message) => message.local_id !== pendingId));
      setNotice('Message was not sent. Check the connection and try again.');
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
      if (conversation_id === conversationId && senderId !== user?.id) {
        setMessages((prev) => mergeUniqueMessages(prev, [message]));
        markConversationRead(conversationId)
          .then(() => setConversation((prev) => prev ? mergeConversationPreservingDisplay(prev, { unread_count: 0 }) : prev))
          .catch(() => undefined);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        if (preferences.vibrationEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    },
    onConversationStatusChanged: (payload: { conversation_id: number; status: string; conversation: Conversation }) => {
      const { conversation_id, status } = payload;
      if (conversation_id === conversationId) {
        setConversation((prev: Conversation | null) => prev ? mergeConversationPreservingDisplay(prev, { ...payload.conversation, status: status as ConversationStatus }) : payload.conversation);
        setStatus(status);
        if (status === 'closed' || status === 'completed') {
          setNotice(status === 'closed' ? 'This conversation has been closed.' : 'This conversation has been completed.');
        }
      }
    },
  });

  const performStatusAction = async (action: 'close' | 'complete' | 'reopen') => {
    try {
      if (action === 'close') {
        await closeConversation(conversationId);
        setConversation((prev) => prev ? mergeConversationPreservingDisplay(prev, { status: 'closed' }) : null);
        setStatus('closed');
        setNotice('Conversation closed. Replies are disabled.');
      } else if (action === 'complete') {
        await completeConversation(conversationId);
        setConversation((prev) => prev ? mergeConversationPreservingDisplay(prev, { status: 'completed' }) : null);
        setStatus('completed');
        setNotice('Conversation completed. Replies are disabled.');
      } else {
        await reopenConversation(conversationId);
        setConversation((prev) => prev ? mergeConversationPreservingDisplay(prev, { status: 'open' }) : null);
        setStatus('open');
        setNotice('Conversation reopened. You can reply again.');
      }
    } catch (error: any) {
      setNotice(error?.response?.data?.error?.message || 'Action failed. Please try again.');
    }
  };

  const confirmAction = (action: 'close' | 'complete' | 'reopen') => {
    const copy = {
      close: ['Close conversation', 'Close this conversation and disable replies?', 'Close'],
      complete: ['Complete conversation', 'Mark this conversation as resolved?', 'Complete'],
      reopen: ['Reopen conversation', 'Reopen this conversation for replies?', 'Reopen'],
    }[action];

    Alert.alert(copy[0], copy[1], [
      { text: 'Cancel', style: 'cancel' },
      { text: copy[2], style: action === 'close' ? 'destructive' : 'default', onPress: () => performStatusAction(action) },
    ]);
  };

  if (!user) {
    return <LoadingState message="Loading conversation..." />;
  }

  if (isNaN(conversationId) || conversationId <= 0) {
    return <EmptyState title="Invalid conversation" subtitle="The conversation ID is invalid." icon="⚠️" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerIdentity}>
          <Text style={styles.headerName} numberOfLines={1}>{customerName}</Text>
          <Text style={styles.headerEmail} numberOfLines={1}>{customerEmail}</Text>
        </View>
        <StatusBadge status={status} variant="solid" />
      </View>

      {isStaff ? (
        <View style={styles.actionStrip}>
          {status === 'open' ? (
            <>
              <Pressable style={[styles.actionButton, styles.completeButton]} onPress={() => confirmAction('complete')}>
                <Ionicons name="checkmark-circle-outline" size={17} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>Complete</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.closeButton]} onPress={() => confirmAction('close')}>
                <Ionicons name="lock-closed-outline" size={17} color={colors.warning} />
                <Text style={[styles.actionText, { color: colors.warning }]}>Close</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={[styles.actionButton, styles.reopenButton]} onPress={() => confirmAction('reopen')}>
              <Ionicons name="refresh-outline" size={17} color={colors.blue} />
              <Text style={[styles.actionText, { color: colors.blue }]}>Reopen</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {notice && (
        <View style={styles.notice}>
          <Ionicons name={isClosed ? 'information-circle-outline' : 'checkmark-circle-outline'} size={18} color={isClosed ? colors.closed : colors.success} />
          <Text style={styles.noticeText}>{notice}</Text>
          <Pressable onPress={() => setNotice(null)} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      )}

      {isClosed && (
        <View style={styles.closedNotice}>
          <Ionicons name="lock-closed" size={18} color={colors.closed} />
          <Text style={styles.closedText}>Replies are disabled because this conversation is {status}.</Text>
        </View>
      )}

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
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
              isSystem={item.sender_type === 'system'}
            />
          )}
          ListEmptyComponent={<EmptyState title="No messages yet" subtitle="Messages will appear here when the conversation starts." icon="💬" />}
          contentContainerStyle={[styles.listContent, messages.length === 0 && styles.emptyMessages, { paddingBottom: insets.bottom + 110 }]}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={[styles.input, isClosed && styles.inputDisabled]}
            placeholder={isClosed ? 'Conversation closed' : 'Write a helpful reply...'}
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!isClosed}
            maxLength={1000}
            placeholderTextColor={colors.faint}
          />
          <Pressable style={[styles.sendButton, (!draft.trim() || isSending || isClosed) && styles.sendButtonDisabled]} onPress={onSend} disabled={!draft.trim() || isSending || isClosed}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  headerEmail: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700',
  },
  actionStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
  },
  completeButton: {
    backgroundColor: colors.successSoft,
    borderColor: '#BBF7D0',
  },
  closeButton: {
    backgroundColor: colors.warningSoft,
    borderColor: '#FDE68A',
  },
  reopenButton: {
    backgroundColor: colors.sky,
    borderColor: '#BFDBFE',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '900',
  },
  notice: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    ...shadow,
  },
  noticeText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  closedNotice: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  closedText: {
    flex: 1,
    color: colors.closed,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  keyboardView: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyMessages: {
    flexGrow: 1,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 116,
    minHeight: 48,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    color: colors.faint,
    backgroundColor: '#EEF2F7',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
