import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';
import { formatFriendlyDate } from '@/src/utils/date';

interface MessageBubbleProps {
  message: string;
  isFromUser: boolean;
  timestamp: string;
  isSystem?: boolean;
}

export function MessageBubble({ message, isFromUser, timestamp, isSystem = false }: MessageBubbleProps) {
  if (isSystem) {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.systemText}>{message}</Text>
        <Text style={styles.systemTime}>{formatFriendlyDate(timestamp)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFromUser ? styles.staffContainer : styles.guestContainer]}>
      <View style={[styles.labelRow, isFromUser ? styles.staffLabelRow : styles.guestLabelRow]}>
        <Text style={styles.senderLabel}>{isFromUser ? 'You' : 'Guest'}</Text>
      </View>
      <View style={[styles.bubble, isFromUser ? styles.staffBubble : styles.guestBubble]}>
        <Text style={[styles.text, isFromUser ? styles.staffText : styles.guestText]}>{message}</Text>
      </View>
      <Text style={[styles.timestamp, isFromUser ? styles.staffTimestamp : styles.guestTimestamp]}>
        {formatFriendlyDate(timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 7,
    maxWidth: '84%',
  },
  staffContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  guestContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  labelRow: {
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  staffLabelRow: {
    alignItems: 'flex-end',
  },
  guestLabelRow: {
    alignItems: 'flex-start',
  },
  senderLabel: {
    fontSize: 11,
    color: colors.faint,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  staffBubble: {
    backgroundColor: colors.navy,
    borderBottomRightRadius: 8,
  },
  guestBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  staffText: {
    color: '#FFFFFF',
  },
  guestText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
    marginHorizontal: 6,
    fontWeight: '600',
  },
  staffTimestamp: {
    color: colors.faint,
  },
  guestTimestamp: {
    color: colors.muted,
  },
  systemWrap: {
    alignSelf: 'center',
    maxWidth: '88%',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#E8EEF7',
  },
  systemText: {
    color: colors.closed,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  systemTime: {
    marginTop: 3,
    color: colors.faint,
    fontSize: 11,
    fontWeight: '700',
  },
});
