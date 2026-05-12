import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

interface StatusBadgeProps {
  status: string;
  variant?: 'solid' | 'soft';
}

const STATUS_META: Record<string, { label: string; color: string; background: string }> = {
  open: { label: 'Open', color: colors.success, background: colors.successSoft },
  pending: { label: 'Pending', color: colors.warning, background: colors.warningSoft },
  completed: { label: 'Completed', color: colors.blue, background: colors.sky },
  resolved: { label: 'Resolved', color: colors.blue, background: colors.sky },
  closed: { label: 'Closed', color: colors.closed, background: colors.closedSoft },
};

export function StatusBadge({ status, variant = 'soft' }: StatusBadgeProps) {
  const key = String(status || 'open').toLowerCase();
  const meta = STATUS_META[key] || { label: key || 'Unknown', color: colors.closed, background: colors.closedSoft };
  const solid = variant === 'solid';

  return (
    <View style={[styles.badge, { backgroundColor: solid ? meta.color : meta.background, borderColor: solid ? meta.color : `${meta.color}33` }]}>
      <View style={[styles.dot, { backgroundColor: solid ? '#FFFFFF' : meta.color }]} />
      <Text style={[styles.text, { color: solid ? '#FFFFFF' : meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
