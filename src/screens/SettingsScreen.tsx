import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '@/src/config/env';
import { useAuth } from '@/src/auth/AuthContext';

export function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.item}>Lunio: {config.lunioWebUrl}</Text>
      <Text style={styles.item}>Support API: {config.supportApiUrl}</Text>
      <Pressable
        style={styles.button}
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' }, title: { fontSize: 24, fontWeight: '700', marginTop: 48, marginBottom: 24 }, item: { fontSize: 14, color: '#334155', marginBottom: 10 }, button: { marginTop: 24, borderRadius: 12, backgroundColor: '#ef4444', padding: 14, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' } });
