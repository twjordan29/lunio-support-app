import { useEffect, useState } from 'react';

import { DEFAULT_PREFERENCES, getNotificationPreferences, saveNotificationPreferences, type NotificationPreferences } from '@/src/auth/notificationPreferences';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getNotificationPreferences().then((prefs) => {
      setPreferences(prefs);
      setIsLoading(false);
    });
  }, []);

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    await saveNotificationPreferences(newPrefs);
  };

  return { preferences, updatePreferences, isLoading };
}