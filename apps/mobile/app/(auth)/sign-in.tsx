import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { colours, spacing, radius, type, minTouch } from '../../src/theme';

type Mode = 'sign-in' | 'sign-up';

export default function SignIn() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);

    const credentials = { email: email.trim(), password };
    const { error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (authError) {
      setError(authError.message);
    } else if (mode === 'sign-up') {
      // Whether a confirmation email is required depends on project settings, so
      // say what happens next rather than assuming the user is now signed in.
      setNotice('Check your email to confirm your account, then sign in.');
      setMode('sign-in');
    }
    setBusy(false);
  };

  const canSubmit = email.trim().length > 3 && password.length >= 8 && !busy;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Rail</Text>
        <Text style={styles.subtitle}>Your wardrobe, and what to wear from it.</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colours.textMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          accessibilityLabel="Email address"
          editable={!busy}
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password (at least 8 characters)"
          placeholderTextColor={colours.textMuted}
          secureTextEntry
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          accessibilityLabel="Password"
          editable={!busy}
        />

        {error !== null && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
        {notice !== null && (
          <Text style={styles.notice} accessibilityRole="alert">
            {notice}
          </Text>
        )}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={mode === 'sign-in' ? 'Sign in' : 'Create account'}
        >
          {busy ? (
            <ActivityIndicator color={colours.accentText} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.switch}
          onPress={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setError(null);
            setNotice(null);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.switchText}>
            {mode === 'sign-in' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  title: { ...type.title, color: colours.text },
  subtitle: { ...type.body, color: colours.textMuted, marginBottom: spacing.lg },
  input: {
    minHeight: minTouch,
    borderWidth: 1,
    borderColor: colours.border,
    borderRadius: radius.md,
    backgroundColor: colours.surface,
    paddingHorizontal: spacing.md,
    ...type.body,
    color: colours.text,
  },
  button: {
    minHeight: minTouch,
    borderRadius: radius.md,
    backgroundColor: colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...type.label, color: colours.accentText, fontSize: 16 },
  switch: { minHeight: minTouch, justifyContent: 'center', alignItems: 'center' },
  switchText: { ...type.caption, color: colours.accent },
  error: { ...type.caption, color: colours.danger },
  notice: { ...type.caption, color: colours.accent },
});
