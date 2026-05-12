import * as SecureStore from 'expo-secure-store';

const PREFS_KEY = 'lunio_support_prefs';

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