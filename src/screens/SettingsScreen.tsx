import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/src/components/AppHeader';
import { config } from '@/src/config/env';
import { useAuth } from '@/src/auth/AuthContext';
import { useNotificationPreferences } from '@/src/hooks/useNotificationPreferences';

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { preferences, updatePreferences } = useNotificationPreferences();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Settings"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Role</Text>
              <Text style={styles.value}>{user.role}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Lunio</Text>
            <Text style={styles.value}>{config.lunioWebUrl}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Support API</Text>
            <Text style={styles.value}>{config.supportApiUrl}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>In-app banners</Text>
            <Switch
              value={preferences.bannersEnabled}
              onValueChange={(value) => updatePreferences({ bannersEnabled: value })}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Vibration</Text>
            <Switch
              value={preferences.vibrationEnabled}
              onValueChange={(value) => updatePreferences({ vibrationEnabled: value })}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Assigned conversations only</Text>
            <Switch
              value={preferences.assignedOnly}
              onValueChange={(value) => updatePreferences({ assignedOnly: value })}
            />
          </View>
        </View>

        <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#64748b',
  },
  value: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#0f172a',
  },
  actions: {
    marginTop: 32,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
