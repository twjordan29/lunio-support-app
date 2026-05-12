import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { colors, shadow } from '@/src/components/theme';

export function LoginScreen() {
  const router = useRouter();
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError('Enter your staff email and password to continue.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await loginWithCredentials(trimmedEmail, trimmedPassword);
      router.replace('/conversations');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.heroGlow} />
        <View style={styles.content}>
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>L</Text>
            </View>
            <Text style={styles.kicker}>Lunio Support</Text>
            <Text style={styles.title}>Staff inbox for customer conversations</Text>
            <Text style={styles.subtitle}>Sign in with your Lunio staff account to manage live guest chats, follow-ups, and closed conversations.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Secure staff access</Text>
            <Text style={styles.cardSubtitle}>Use your Lunio credentials. Sessions are stored securely on this device.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email address</Text>
              <View style={[styles.inputShell, error && !email.trim() ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={18} color={colors.faint} />
                <TextInput
                  placeholder="staff@lunio.com"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholderTextColor={colors.faint}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputShell, error && !password.trim() ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.faint} />
                <TextInput
                  placeholder="Enter password"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colors.faint}
                />
                <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isLoading && styles.buttonDisabled]} onPress={onLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign in to inbox</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  keyboardView: {
    flex: 1,
  },
  heroGlow: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 160,
    backgroundColor: '#1D4ED855',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  brandBlock: {
    marginBottom: 28,
  },
  logoMark: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
  },
  logoText: {
    color: colors.navy,
    fontSize: 32,
    fontWeight: '900',
  },
  kicker: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 12,
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 20,
    ...shadow,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 7,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  inputShell: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  error: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  button: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
