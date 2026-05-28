/* ============================================================
   Obsidian Capital Mobile — Register Screen (3 steps)
   Step 1: Name / Email / Password
   Step 2: DOB / SSN-4 / Address
   Step 3: Choose Tier
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
import { authApi } from '@/services/api';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/services/api';

// ── Tier definitions ──────────────────────────────────────────

const TIERS = [
  {
    id: 'standard' as const,
    name: 'Standard',
    price: 'Free',
    rate: '10–12%',
    features: ['Full platform access', 'Real-time quotes', 'Standard commission rate'],
  },
  {
    id: 'member' as const,
    name: 'Member',
    price: '$29.99/mo',
    rate: '7–9%',
    features: ['All Standard features', 'Priority support', 'Reduced commission rate'],
  },
  {
    id: 'private' as const,
    name: 'Private Client',
    price: '$199.99/mo',
    rate: '5–6%',
    features: ['All Member features', 'Dedicated advisor', 'Lowest commission rate', 'Exclusive research'],
  },
];

// ── Step Indicator ────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={steps.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[steps.dot, i === current ? steps.dotActive : i < current ? steps.dotDone : null]}
        />
      ))}
    </View>
  );
}

const steps = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 24,
  },
  dotDone: {
    backgroundColor: Colors.gold + '66',
  },
});

// ── Input Field ───────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  maxLength,
  error,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  maxLength?: number;
  error?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <View style={fieldS.wrapper}>
      <Text style={fieldS.label}>{label}</Text>
      <View style={fieldS.inputRow}>
        <TextInput
          style={[fieldS.input, error ? fieldS.inputError : null, suffix ? { flex: 1 } : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCapitalize="none"
          selectionColor={Colors.gold}
        />
        {suffix}
      </View>
      {error && <Text style={fieldS.error}>{error}</Text>}
    </View>
  );
}

const fieldS = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
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
  inputError: { borderColor: Colors.loss },
  error: { color: Colors.loss, fontSize: 12, marginTop: 4 },
});

// ── Register Screen ───────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const { isLoading } = useAuthStore();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);

  // Step 2 fields
  const [dob,     setDob]     = useState('');
  const [ssnLast4, setSsnLast4] = useState('');
  const [address, setAddress] = useState('');
  const [city,    setCity]    = useState('');
  const [state,   setState]   = useState('');
  const [zip,     setZip]     = useState('');

  // Step 3
  const [tier, setTier] = useState<'standard' | 'member' | 'private'>('standard');

  // Validation
  const [errs, setErrs] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name required';
    if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Valid email required';
    if (password.length < 8) e.password = 'Minimum 8 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!dob) e.dob = 'Date of birth required (YYYY-MM-DD)';
    if (ssnLast4.length !== 4 || !/^\d{4}$/.test(ssnLast4)) e.ssnLast4 = '4 digits required';
    if (!address.trim()) e.address = 'Address required';
    if (!city.trim()) e.city = 'City required';
    if (!state.trim()) e.state = 'State required';
    if (!zip.trim()) e.zip = 'ZIP required';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = useCallback(() => {
    setError('');
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    if (step < 2) setStep((s) => s + 1);
  }, [step, name, email, password, confirm, dob, ssnLast4, address, city, state, zip]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      const { token, user } = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        tier,
        dob,
        ssnLast4,
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip: zip.trim(),
      });
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      // Manually update store state via login call is not needed — hydrate via useAuthStore
      // Navigate to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Registration failed.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [name, email, password, tier, dob, ssnLast4, address, city, state, zip, router]);

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandName}>OBSIDIAN CAPITAL</Text>
            <Text style={styles.title}>Create Your Account</Text>
          </View>

          {/* Step indicator */}
          <StepIndicator current={step} total={3} />

          {/* Error */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Step 1: Identity ─────────────────────────── */}
          {step === 0 && (
            <View>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Field label="Full Name" value={name} onChangeText={setName}
                placeholder="John Smith" error={errs.name} keyboardType="default" />
              <Field label="Email Address" value={email} onChangeText={setEmail}
                placeholder="you@example.com" keyboardType="email-address" error={errs.email} />
              <Field label="Password" value={password} onChangeText={setPassword}
                placeholder="Min 8 characters" secureTextEntry={!showPw} error={errs.password}
                suffix={
                  <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.showBtn}>
                    <Text style={styles.showBtnText}>{showPw ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                }
              />
              <Field label="Confirm Password" value={confirm} onChangeText={setConfirm}
                placeholder="Repeat password" secureTextEntry={!showPw} error={errs.confirm} />
            </View>
          )}

          {/* ── Step 2: KYC Info ─────────────────────────── */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Verification Details</Text>
              <Text style={styles.stepDesc}>
                Required by FINRA/SEC regulations for account verification.
              </Text>
              <Field label="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob}
                placeholder="1990-01-15" error={errs.dob} />
              <Field label="Last 4 digits of SSN" value={ssnLast4} onChangeText={setSsnLast4}
                placeholder="XXXX" keyboardType="numeric" maxLength={4} error={errs.ssnLast4} />
              <Field label="Street Address" value={address} onChangeText={setAddress}
                placeholder="123 Main St" error={errs.address} />
              <View style={styles.rowFields}>
                <View style={styles.rowFieldLarge}>
                  <Field label="City" value={city} onChangeText={setCity}
                    placeholder="New York" error={errs.city} />
                </View>
                <View style={styles.rowFieldSmall}>
                  <Field label="State" value={state} onChangeText={(t) => setState(t.toUpperCase())}
                    placeholder="NY" maxLength={2} error={errs.state} />
                </View>
              </View>
              <Field label="ZIP Code" value={zip} onChangeText={setZip}
                placeholder="10001" keyboardType="numeric" maxLength={10} error={errs.zip} />
            </View>
          )}

          {/* ── Step 3: Choose Tier ──────────────────────── */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Choose Your Membership</Text>
              <Text style={styles.stepDesc}>
                Your tier determines your commission rate on every trade.
              </Text>
              {TIERS.map((t) => {
                const selected = tier === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tierCard, selected && styles.tierCardSelected]}
                    onPress={() => setTier(t.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.tierHeader}>
                      <View>
                        <Text style={[styles.tierName, selected && { color: Colors.gold }]}>
                          {t.name}
                        </Text>
                        <Text style={styles.tierRate}>{t.rate} commission</Text>
                      </View>
                      <View>
                        <Text style={[styles.tierPrice, selected && { color: Colors.gold }]}>
                          {t.price}
                        </Text>
                      </View>
                    </View>
                    {t.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <Text style={[styles.featureDot, selected && { color: Colors.gold }]}>•</Text>
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                    {selected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>Selected</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.button, (submitting || isLoading) && styles.buttonDisabled]}
            onPress={step < 2 ? handleNext : handleSubmit}
            disabled={submitting || isLoading}
            activeOpacity={0.85}
          >
            {(submitting || isLoading) ? (
              <ActivityIndicator color={Colors.obsidian} size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {step < 2 ? 'Continue' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.obsidian },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  brandName: {
    color: Colors.gold,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  stepTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 18,
    lineHeight: 19,
  },
  errorBanner: {
    backgroundColor: Colors.loss + '22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.loss + '55',
  },
  errorText: { color: Colors.loss, fontSize: 13 },
  rowFields: { flexDirection: 'row', gap: 12 },
  rowFieldLarge: { flex: 2 },
  rowFieldSmall: { flex: 1 },
  showBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  showBtnText: { color: Colors.gold, fontSize: 13, fontWeight: '600' },
  tierCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  tierCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.surface2,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierName: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  tierRate: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  tierPrice: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  featureRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  featureDot: { color: Colors.textMuted, fontSize: 14 },
  featureText: { color: Colors.textMuted, fontSize: 13 },
  selectedBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Colors.gold + '22',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  selectedBadgeText: { color: Colors.gold, fontSize: 11, fontWeight: '700' },
  button: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: Colors.obsidian,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backBtn: { alignItems: 'center', paddingVertical: 12 },
  backBtnText: { color: Colors.textMuted, fontSize: 14 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { color: Colors.textMuted, fontSize: 14 },
  loginLink: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
});
