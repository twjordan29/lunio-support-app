import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MessageBubbleProps {
  message: string;
  isFromUser: boolean;
  timestamp: string;
}

export function MessageBubble({ message, isFromUser, timestamp }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isFromUser ? styles.userContainer : styles.supportContainer]}>
      <View style={[styles.bubble, isFromUser ? styles.userBubble : styles.supportBubble]}>
        <Text style={[styles.text, isFromUser ? styles.userText : styles.supportText]}>
          {message}
        </Text>
      </View>
      <Text style={[styles.timestamp, isFromUser ? styles.userTimestamp : styles.supportTimestamp]}>
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  supportContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#2563eb',
  },
  supportBubble: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  supportText: {
    color: '#0f172a',
  },
  timestamp: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  userTimestamp: {
    color: '#94a3b8',
  },
  supportTimestamp: {
    color: '#64748b',
  },
});
