import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { config } from '@/src/config/env';
import { getNotificationPreferences, saveNotificationPreferences } from '@/src/auth/notificationPreferences';
import { getAuthToken } from '@/src/auth/tokenStorage';

export function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  console.log('[push] Notification permission status:', status);
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<{ token: string | null; error: string | null }> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('[push] Expo push token retrieved successfully');
    return { token: token.data, error: null };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('[push] Failed to get push token:', errorMessage);
    return { token: null, error: errorMessage };
  }
}

export async function registerPushTokenWithLunio(): Promise<{ success: boolean; error: string | null }> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) {
      return { success: false, error: 'No auth token' };
    }

    const { token: pushToken, error: tokenError } = await getExpoPushToken();
    if (!pushToken) {
      return { success: false, error: tokenError || 'Failed to get push token' };
    }

    const prefs = await getNotificationPreferences();
    if (!prefs.pushNotificationsEnabled) {
      return { success: false, error: 'Push notifications not enabled' };
    }

    console.log('[push] Registering device with Lunio endpoint');
    const response = await fetch(`${config.lunioWebUrl}/api/mobile/support/devices/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expo_push_token: pushToken,
        platform: Platform.OS,
        app_version: '1.0.0', // TODO: get from config or app.json
      }),
    });

    const data = await response.json();
    console.log('[push] Register response status:', response.status, 'body:', data);

    if (data.ok) {
      await saveNotificationPreferences({ ...prefs, pushTokenRegistered: true, pushRegistrationError: null });
      return { success: true, error: null };
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('[push] Failed to register push token:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function unregisterPushTokenFromLunio(): Promise<boolean> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) return false;

    const { token: pushToken } = await getExpoPushToken();
    if (!pushToken) return false;

    console.log('[push] Unregistering device from Lunio endpoint');
    const response = await fetch(`${config.lunioWebUrl}/api/mobile/support/devices/unregister`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expo_push_token: pushToken,
      }),
    });

    const data = await response.json();
    console.log('[push] Unregister response status:', response.status, 'body:', data);

    if (data.ok) {
      const prefs = await getNotificationPreferences();
      await saveNotificationPreferences({ ...prefs, pushTokenRegistered: false, pushRegistrationError: null });
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('[push] Failed to unregister push token:', error?.message);
    return false;
  }
}

export async function setupPushNotifications(): Promise<void> {
  const isExpoGo = isRunningInExpoGo();
  const prefs = await getNotificationPreferences();

  if (isExpoGo) {
    // Expo Go doesn't support remote push notifications on Android SDK 53+
    console.log('[push] Running in Expo Go, skipping push setup');
    await saveNotificationPreferences({
      ...prefs,
      pushNotificationsEnabled: false,
      pushTokenRegistered: false,
      isExpoGo: true,
      pushRegistrationError: null,
    });
    return;
  }

  const granted = await requestNotificationPermission();

  if (granted) {
    await saveNotificationPreferences({ ...prefs, pushNotificationsEnabled: true, isExpoGo: false });
    const { success, error } = await registerPushTokenWithLunio();
    if (!success) {
      await saveNotificationPreferences({
        ...prefs,
        pushNotificationsEnabled: true,
        pushTokenRegistered: false,
        isExpoGo: false,
        pushRegistrationError: error,
      });
    }
  } else {
    await saveNotificationPreferences({
      ...prefs,
      pushNotificationsEnabled: false,
      pushTokenRegistered: false,
      isExpoGo: false,
      pushRegistrationError: 'Permission denied',
    });
  }
}