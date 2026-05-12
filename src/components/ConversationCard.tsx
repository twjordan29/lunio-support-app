import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from './StatusBadge';
import type { Conversation } from '@/src/types/support';

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const hasUnread = (conversation.unread_count ?? 0) > 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {conversation.customer_name || 'Unknown Customer'}
        </Text>
        <StatusBadge status={conversation.status} />
      </View>
      <Text style={styles.email} numberOfLines={1}>
        {conversation.customer_email || 'No email'}
      </Text>
      {conversation.subject && (
        <Text style={styles.subject} numberOfLines={2}>
          {conversation.subject}
        </Text>
      )}
      <View style={styles.footer}>
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unread_count}</Text>
          </View>
        )}
        {conversation.updated_at && (
          <Text style={styles.time}>
            {new Date(conversation.updated_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
