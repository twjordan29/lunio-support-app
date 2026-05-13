import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/src/auth/AuthContext';
import { addNotificationResponseRoutingListener, configureNotificationRuntime } from '@/src/services/pushNotifications';

export default function RootLayout() {
  React.useEffect(() => {
    configureNotificationRuntime().catch((error) => console.error('Failed to configure notifications:', error));
    const subscription = addNotificationResponseRoutingListener();
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="conversations/index" />
          <Stack.Screen name="conversations/[id]" />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
