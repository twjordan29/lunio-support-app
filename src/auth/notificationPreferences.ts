import * as SecureStore from 'expo-secure-store';

const PREFS_KEY = 'lunio_support_prefs';

export type NotificationPreferences = {
  bannersEnabled: boolean;
  vibrationEnabled: boolean;
  assignedOnly: boolean;
  pushNotificationsEnabled: boolean;
  pushTokenRegistered: boolean;
};

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  bannersEnabled: true,
  vibrationEnabled: true,
  assignedOnly: false,
  pushNotificationsEnabled: false,
  pushTokenRegistered: false,
};

export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefsJson = await SecureStore.getItemAsync(PREFS_KEY);
    const prefs = prefsJson ? JSON.parse(prefsJson) : {};
    return { ...DEFAULT_PREFERENCES, ...prefs };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}