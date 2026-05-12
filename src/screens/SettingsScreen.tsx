import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/auth/AuthContext';
import { AppHeader } from '@/src/components/AppHeader';
import { colors, shadow } from '@/src/components/theme';
import { config } from '@/src/config/env';
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
      <AppHeader title="Settings" subtitle="Account and support console" onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {user && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{String(user.name || user.email || 'S').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingToggle
            icon="notifications-outline"
            label="In-app banners"
            value={preferences.bannersEnabled}
            onValueChange={(value) => updatePreferences({ bannersEnabled: value })}
          />
          <SettingToggle
            icon="phone-portrait-outline"
            label="Vibration"
            value={preferences.vibrationEnabled}
            onValueChange={(value) => updatePreferences({ vibrationEnabled: value })}
          />
          <SettingToggle
            icon="person-circle-outline"
            label="Assigned conversations only"
            value={preferences.assignedOnly}
            onValueChange={(value) => updatePreferences({ assignedOnly: value })}
          />
          <InfoRow label="Push notifications" value={preferences.isExpoGo ? 'Development build required' : preferences.pushNotificationsEnabled && preferences.pushTokenRegistered ? 'Enabled and registered' : preferences.pushNotificationsEnabled ? 'Enabled, not registered' : 'Disabled'} />
          {preferences.isExpoGo && <Text style={styles.infoText}>Push notifications require a development build on Android. Expo Go can only test the app UI.</Text>}
          {preferences.pushRegistrationError && (
            <Text style={styles.infoText}>
              {preferences.pushRegistrationError.includes('FirebaseApp') || preferences.pushRegistrationError.includes('FCM')
                ? 'Firebase/FCM config is required. Add google-services.json and rebuild the development app.'
                : `Registration failed: ${preferences.pushRegistrationError}`}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App details</Text>
          <InfoRow label="Lunio" value={config.lunioWebUrl} />
          <InfoRow label="Support API" value={config.supportApiUrl} />
          <InfoRow label="Console" value="Lunio Support 1.0" />
        </View>

        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({ icon, label, value, onValueChange }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLabelWrap}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color={colors.blue} />
        </View>
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} thumbColor={value ? '#FFFFFF' : '#F8FAFC'} trackColor={{ false: '#CBD5E1', true: colors.blue }} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  profileEmail: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 13,
  },
  rolePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.sky,
  },
  roleText: {
    color: colors.blueDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sky,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '800',
  },
  infoRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  infoText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  logoutButton: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.danger,
  },
  logoutPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
