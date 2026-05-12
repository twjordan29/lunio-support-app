import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, FlatList, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getConversations } from '@/src/api/supportApi';
import { useAuth } from '@/src/auth/AuthContext';
import { ConnectionPill } from '@/src/components/ConnectionPill';
import { ConversationCard } from '@/src/components/ConversationCard';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingState } from '@/src/components/LoadingState';
import { Toast } from '@/src/components/Toast';
import { colors } from '@/src/components/theme';
import { useNotificationPreferences } from '@/src/hooks/useNotificationPreferences';
import { useSupportSocket } from '@/src/hooks/useSupportSocket';
import type { Conversation, ConversationStatus, SupportMessage } from '@/src/types/support';
import { applyConversationEvent, applyMessageEventToConversation, getActiveUnreadTotal, markConversationReadLocally } from '@/src/utils/conversationEvents';
import { mergeUniqueConversations } from '@/src/utils/merge';

type FilterType = 'all' | 'open' | 'mine' | 'completed' | 'closed';
const SUPPORT_APP_DEBUG = false;

const hasGuestName = (conversation?: Conversation | null) => !!(conversation?.guest_name || conversation?.customer_name || conversation?.visitor_name || conversation?.contact_name || conversation?.name);
const hasGuestEmail = (conversation?: Conversation | null) => !!(conversation?.guest_email || conversation?.customer_email || conversation?.visitor_email || conversation?.contact_email || conversation?.email);

export function ConversationListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user, logout } = useAuth();
  const { preferences } = useNotificationPreferences();
  const [items, setItems] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('open');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleIncomingMessage = useCallback((payload: { conversation_id: number; message: SupportMessage }) => {
    const { message } = payload;
    const senderId = message.sender_id;
    if (senderId === user?.id) {
      setItems((prev) => applyMessageEventToConversation(prev, payload, user?.id));
      return;
    }

    setItems((prev) => {
      const conversation = prev.find((c) => c.id === payload.conversation_id);
      if (preferences.assignedOnly && !conversation?.assigned_admin_id) return prev;
      if (SUPPORT_APP_DEBUG) {
        console.debug('[support-app] socket event received', {
          event: 'message:new',
          conversation_id: payload.conversation_id,
          inbox_updated: true,
          has_guest_name: hasGuestName(conversation),
          has_guest_email: hasGuestEmail(conversation),
        });
      }
      return applyMessageEventToConversation(prev, payload, user?.id);
    });

    if (preferences.bannersEnabled) {
      setToastMessage(`New message from ${message.sender_type === 'guest' ? 'guest' : 'customer'}`);
      setShowToast(true);
    }
    if (preferences.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [preferences.assignedOnly, preferences.bannersEnabled, preferences.vibrationEnabled, user?.id]);

  const handleConversationUpdate = useCallback((payload: { conversation_id?: number; status?: string; conversation?: Conversation }) => {
    if (SUPPORT_APP_DEBUG) {
      console.debug('[support-app] socket event received', {
        event: 'conversation:updated',
        conversation_id: payload.conversation_id || payload.conversation?.id || null,
        inbox_updated: true,
        has_guest_name: hasGuestName(payload.conversation),
        has_guest_email: hasGuestEmail(payload.conversation),
      });
    }
    setItems((prev) => applyConversationEvent(prev, payload));
  }, []);

  const handleConversationRead = useCallback((payload: { conversation_id?: number }) => {
    const conversationId = Number(payload.conversation_id || 0);
    if (!conversationId) return;
    setItems((prev) => markConversationReadLocally(prev, conversationId));
  }, []);

  const { isConnected } = useSupportSocket(token, {
    onAuthError: async () => {
      console.debug('[list] auth error, logging out');
      await logout();
      router.replace('/login');
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
    },
    onConversationUpdated: handleConversationUpdate,
    onMessageCreated: handleIncomingMessage,
    onConversationStatusChanged: (payload: { conversation_id: number; status: string; conversation: Conversation }) => {
      if (SUPPORT_APP_DEBUG) {
        console.debug('[support-app] socket event received', {
          event: 'conversation:status_changed',
          conversation_id: payload.conversation_id,
          inbox_updated: true,
          has_guest_name: hasGuestName(payload.conversation),
          has_guest_email: hasGuestEmail(payload.conversation),
        });
      }
      handleConversationUpdate({ ...payload, conversation: { ...payload.conversation, status: payload.status as ConversationStatus } });
    },
    onConversationRead: handleConversationRead,
  });

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const conversations = await getConversations();
      setItems((prev) => mergeUniqueConversations(prev, conversations));
    } catch {
      setItems([]);
    }
  }, [token]);

  useEffect(() => {
    loadConversations().finally(() => setIsLoading(false));
  }, [loadConversations]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const counts = useMemo(() => ({
    open: items.filter((item) => item.status === 'open').length,
    mine: items.filter((item) => item.assigned_admin_id !== null && item.status === 'open').length,
    completed: items.filter((item) => item.status === 'completed').length,
    closed: items.filter((item) => item.status === 'closed').length,
    all: items.length,
  }), [items]);
  const activeUnreadTotal = useMemo(() => getActiveUnreadTotal(items), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      switch (filter) {
        case 'open':
          return item.status === 'open';
        case 'mine':
          return item.assigned_admin_id !== null && item.status === 'open';
        case 'completed':
          return item.status === 'completed';
        case 'closed':
          return item.status === 'closed';
        default:
          return true;
      }
    });
  }, [items, filter]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <LoadingState message="Preparing your support queue..." />;
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'mine', label: 'Mine' },
    { key: 'completed', label: 'Completed' },
    { key: 'closed', label: 'Closed' },
    { key: 'all', label: 'All' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Lunio Support</Text>
            <Text style={styles.title}>Inbox</Text>
          </View>
          <View style={styles.headerActions}>
            <ConnectionPill connected={isConnected} />
            <Pressable style={styles.iconButton} onPress={() => router.push('/settings')} hitSlop={8}>
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryNumber}>{counts.open}</Text>
            <Text style={styles.summaryLabel}>Open conversations</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryNumber}>{activeUnreadTotal}</Text>
            <Text style={styles.summaryLabel}>Active unread</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filters.map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable key={key} style={[styles.filterButton, active && styles.filterButtonActive]} onPress={() => setFilter(key)}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
                <Text style={[styles.filterCount, active && styles.filterCountActive]}>{counts[key]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={styles.list}
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            currentUserId={user?.id}
            onPress={() => {
              setItems((prev) => markConversationReadLocally(prev, item.id));
              router.push({ pathname: '/conversations/[id]', params: { id: String(item.id), conversation: JSON.stringify(item) } });
            }}
          />
        )}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        ListEmptyComponent={
          <EmptyState
            title={filter === 'all' ? 'No conversations yet' : `No ${filter} conversations`}
            subtitle={filter === 'open' ? 'New guest conversations will appear here as soon as they arrive.' : 'Try another filter or pull down to refresh the queue.'}
            icon="💬"
          />
        }
        contentContainerStyle={[styles.listContent, filteredItems.length === 0 && styles.emptyContainer]}
      />

      <Toast message={toastMessage || ''} visible={showToast} onHide={() => setShowToast(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  summaryCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#CBD5E1',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: 16,
  },
  filterBar: {
    paddingTop: 14,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 9,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '900',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    minWidth: 22,
    textAlign: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.surfaceSoft,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
