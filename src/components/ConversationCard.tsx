import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from './StatusBadge';
import { colors, shadow } from './theme';
import { formatFriendlyDate } from '@/src/utils/date';
import type { Conversation } from '@/src/types/support';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId?: number | null;
  onPress: () => void;
}

export function ConversationCard({ conversation, currentUserId, onPress }: ConversationCardProps) {
  const hasUnread = (conversation.unread_count ?? 0) > 0;
  const isMine = !!currentUserId && conversation.assigned_admin_id === currentUserId;
  const name = conversation.customer_name || 'Guest visitor';
  const email = conversation.customer_email || 'No email provided';
  const snippet = conversation.subject || 'No recent message preview available yet.';

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{String(name).trim().slice(0, 1).toUpperCase() || 'G'}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.email} numberOfLines={1}>{email}</Text>
        </View>
        <View style={styles.metaRight}>
          {conversation.updated_at && <Text style={styles.time}>{formatFriendlyDate(conversation.updated_at)}</Text>}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.snippet} numberOfLines={2}>{snippet}</Text>

      <View style={styles.footer}>
        <StatusBadge status={conversation.status} />
        {isMine ? (
          <View style={styles.minePill}>
            <Text style={styles.mineText}>Assigned to me</Text>
          </View>
        ) : conversation.assigned_admin_id ? (
          <View style={styles.assignedPill}>
            <Text style={styles.assignedText}>Assigned</Text>
          </View>
        ) : (
          <View style={styles.unassignedPill}>
            <Text style={styles.unassignedText}>Unassigned</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: '#E8EEF7',
    ...shadow,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  email: {
    marginTop: 3,
    fontSize: 13,
    color: colors.muted,
  },
  metaRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: colors.faint,
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  snippet: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  minePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.sky,
  },
  mineText: {
    color: colors.blueDark,
    fontSize: 12,
    fontWeight: '800',
  },
  assignedPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surfaceSoft,
  },
  assignedText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  unassignedPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.warningSoft,
  },
  unassignedText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
  },
});
