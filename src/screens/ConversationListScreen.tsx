import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, FlatList, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConversationCard } from '@/src/components/ConversationCard';
import { EmptyState } from '@/src/components/EmptyState';
import { LoadingState } from '@/src/components/LoadingState';
import { getConversations } from '@/src/api/supportApi';
import { useAuth } from '@/src/auth/AuthContext';
import { useSupportSocket } from '@/src/hooks/useSupportSocket';
import type { Conversation } from '@/src/types/support';

type FilterType = 'all' | 'open' | 'mine' | 'completed' | 'closed';

export function ConversationListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { isConnected } = useSupportSocket(token);
  const [items, setItems] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('open');

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const conversations = await getConversations();
      setItems(conversations);
    } catch {
      setItems([]);
    }
  }, [token]);

  useEffect(() => {
    loadConversations().finally(() => setIsLoading(false));
  }, [loadConversations]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent back button from exiting the app on conversation list
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      switch (filter) {
        case 'open':
          return item.status === 'open';
        case 'mine':
          return item.assigned_admin_id !== null;
        case 'completed':
          return item.status === 'resolved';
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

  const statusIndicator = isConnected ? '🟢 Live' : '🔴 Offline';

  if (isLoading) {
    return <LoadingState />;
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Conversations</Text>
        <View style={styles.headerRight}>
          <Text style={styles.status}>{statusIndicator}</Text>
          <Text style={styles.settings} onPress={() => router.push('/settings')}>⚙️</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filters.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.filterButton, filter === key && styles.filterButtonActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        style={styles.list}
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() => router.push(`/conversations/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title={`No ${filter} conversations`}
            subtitle={filter === 'all' ? "New support requests will appear here" : `No conversations match the ${filter} filter`}
            icon="💬"
          />
        }
        contentContainerStyle={filteredItems.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 12,
  },
  settings: {
    fontSize: 20,
  },
  filterBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
});
