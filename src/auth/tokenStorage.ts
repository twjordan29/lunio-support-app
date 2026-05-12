import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'lunio_support_auth_token';
const USER_KEY = 'lunio_support_user';

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveUser(user: any): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
  try {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    // If JSON is corrupted, return null to avoid crashes
    console.warn('Failed to parse user data from storage:', error);
    return null;
  }
}
