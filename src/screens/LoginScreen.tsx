import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';

export function LoginScreen() {
  const router = useRouter();
  const { loginWithBridgeToken } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    const token = tokenInput.trim();
    if (!token) {
      setError('Support token required.');
      return;
    }

    await loginWithBridgeToken(token);
    router.replace('/conversations');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lunio Support</Text>
      <Text style={styles.caption}>Phase 1 uses a placeholder mobile auth bridge token.</Text>
      <TextInput
        placeholder="Paste support/admin token"
        style={styles.input}
        value={tokenInput}
        onChangeText={setTokenInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f7fb' }, title: { fontSize: 28, fontWeight: '700', marginBottom: 8, color: '#0f172a' }, caption: { color: '#475569', marginBottom: 16 }, input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14, backgroundColor: '#fff' }, error: { color: '#b91c1c', marginTop: 8 }, button: { marginTop: 16, backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '600' } });
