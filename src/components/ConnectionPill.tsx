import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

interface ConnectionPillProps {
  connected: boolean;
}

export function ConnectionPill({ connected }: ConnectionPillProps) {
  return (
    <View style={[styles.pill, connected ? styles.live : styles.offline]}>
      <View style={[styles.dot, connected ? styles.liveDot : styles.offlineDot]} />
      <Text style={styles.text}>{connected ? 'Live' : 'Offline'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
  },
  live: {
    backgroundColor: 'rgba(22,163,74,0.14)',
    borderColor: 'rgba(134,239,172,0.24)',
  },
  offline: {
    backgroundColor: 'rgba(220,38,38,0.13)',
    borderColor: 'rgba(252,165,165,0.24)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  liveDot: {
    backgroundColor: colors.success,
  },
  offlineDot: {
    backgroundColor: colors.danger,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
