/* ============================================================
   Obsidian Capital Mobile — Login Screen
   ============================================================ */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth';

// ── Hexagon Logo SVG (pure View-based) ────────────────────────

function HexLogo() {
  return (
    <View style={logo.wrapper}>
      <View style={logo.outer}>
        <View style={logo.inner}>
          <Text style={logo.letter}>O</Text>
        </View>
      </View>
    </View>
  );
}

const logo = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  outer: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  inner: {
    transform: [{ rotate: '-45deg' }],
  },
  letter: {
    color: Colors.gold,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

// ── Login Screen ──────────────────────────────────────────────

export default function LoginScreen() {
  const router    = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback((): boolean => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    clearError();
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/dashboard');
    } catch {
      // error is set in store
    }
  }, [email, password, login, validate, clearError, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + brand */}
          <View style={styles.brand}>
            <HexLogo />
            <Text style={styles.brandName}>OBSIDIAN CAPITAL</Text>
            <Text style={styles.tagline}>Luxury Private Trading</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {/* Global error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, fieldErrors.email ? styles.inputError : null]}
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                selectionColor={Colors.gold}
              />
              {fieldErrors.email && (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              )}
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput, fieldErrors.password ? styles.inputError : null]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  selectionColor={Colors.gold}
                />
                <TouchableOpacity
                  style={styles.showPassBtn}
                  onPress={() => setShowPass((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.showPassText}>{showPass ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              )}
            </View>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.obsidian} size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandName: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 18,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: Colors.loss + '22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.loss + '55',
  },
  errorBannerText: {
    color: Colors.loss,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.text,
    fontSize: 15,
  },
  inputError: {
    borderColor: Colors.loss,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 56,
  },
  showPassBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showPassText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldError: {
    color: Colors.loss,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.obsidian,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});
