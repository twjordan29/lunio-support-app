import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from './theme';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading support inbox...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.blue} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  card: {
    minWidth: 220,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 26,
    ...shadow,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
});
