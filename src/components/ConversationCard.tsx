import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from './StatusBadge';
import { formatFriendlyDate } from '@/src/utils/date';
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
            {formatFriendlyDate(conversation.updated_at)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  email: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
  },
  subject: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
