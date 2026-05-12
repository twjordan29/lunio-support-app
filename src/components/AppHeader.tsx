import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AppHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export function AppHeader({ title, rightAction, onBack }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack && (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {rightAction && <View style={styles.right}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 24,
    color: '#334155',
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  right: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
