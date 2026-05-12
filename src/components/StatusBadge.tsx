import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface StatusBadgeProps {
  status: string;
  variant?: 'primary' | 'secondary';
}

const STATUS_COLORS: Record<string, string> = {
  open: '#10b981',
  pending: '#f59e0b',
  resolved: '#3b82f6',
  closed: '#6b7280',
  default: '#6b7280',
};

export function StatusBadge({ status, variant = 'primary' }: StatusBadgeProps) {
  const backgroundColor = STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.default;
  const textColor = variant === 'primary' ? '#ffffff' : backgroundColor;
  const backgroundColorStyle = variant === 'primary' ? backgroundColor : 'transparent';
  const borderWidth = variant === 'secondary' ? 1 : 0;
  const borderColor = variant === 'secondary' ? backgroundColor : 'transparent';

  return (
    <Text
      style={[
        styles.badge,
        {
          backgroundColor: backgroundColorStyle,
          color: textColor,
          borderWidth,
          borderColor,
        },
      ]}
    >
      {status}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
});
