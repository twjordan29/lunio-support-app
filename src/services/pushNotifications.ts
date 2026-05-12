import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { config } from '@/src/config/env';
import { getNotificationPreferences, saveNotificationPreferences } from '@/src/auth/notificationPreferences';
import { getAuthToken } from '@/src/auth/tokenStorage';

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export async function registerPushTokenWithLunio(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const pushToken = await getExpoPushToken();
    if (!pushToken) return false;

    const prefs = await getNotificationPreferences();
    if (!prefs.pushNotificationsEnabled) return false;

    const response = await fetch(`${config.lunioWebUrl}/api/mobile/support/devices/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expo_push_token: pushToken,
        platform: Platform.OS,
        app_version: '1.0.0', // TODO: get from config or app.json
      }),
    });

    const data = await response.json();
    if (data.ok) {
      await saveNotificationPreferences({ ...prefs, pushTokenRegistered: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return false;
  }
}

export async function unregisterPushTokenFromLunio(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const pushToken = await getExpoPushToken();
    if (!pushToken) return false;

    const response = await fetch(`${config.lunioWebUrl}/api/mobile/support/devices/unregister`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expo_push_token: pushToken,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      const prefs = await getNotificationPreferences();
      await saveNotificationPreferences({ ...prefs, pushTokenRegistered: false });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    return false;
  }
}

export async function setupPushNotifications(): Promise<void> {
  const granted = await requestNotificationPermission();
  const prefs = await getNotificationPreferences();

  if (granted) {
    await saveNotificationPreferences({ ...prefs, pushNotificationsEnabled: true });
    await registerPushTokenWithLunio();
  } else {
    await saveNotificationPreferences({ ...prefs, pushNotificationsEnabled: false, pushTokenRegistered: false });
  }
}