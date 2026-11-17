import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { clearAllCachedData } from '@/hooks/use-api-data';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup' | 'reset';

const TITLES: Record<Mode, string> = {
  login: 'Welcome back',
  signup: 'Create your account',
  reset: 'Reset your password',
};

const SUBMIT_LABELS: Record<Mode, string> = {
  login: 'Sign in',
  signup: 'Create account',
  reset: 'Send reset email',
};

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSession(data.session);
        setChecking(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Never show one account's cached records to the next person who signs in.
      if (event === 'SIGNED_OUT') void clearAllCachedData();
      setSession(nextSession);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setMessage(null);
  };

  const submit = async () => {
    if (busy) return;
    setMessage(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || (mode !== 'reset' && password.length < 8)) {
      setMessage({
        text:
          mode === 'reset'
            ? 'Enter your email address.'
            : 'Enter your email and a password with at least 8 characters.',
        isError: true,
      });
      return;
    }

    setBusy(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) throw error;

        setMode('login');
        setMessage({
          text: data.session
            ? 'Account created. You are signed in.'
            : 'Account created. Check your email to confirm your address, then sign in.',
          isError: false,
        });
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
        if (error) throw error;

        setMessage({
          text: 'Password reset instructions have been sent if this email is registered.',
          isError: false,
        });
      }
    } catch (error: any) {
      setMessage({
        text: error?.message || 'Authentication failed. Please try again.',
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (session) return <>{children}</>;

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
      >
        <View style={styles.card}>
          <Text style={styles.brand}>MEDIMIND</Text>
          <Text style={styles.title} accessibilityRole="header">
            {TITLES[mode]}
          </Text>
          <Text style={styles.subtitle}>Your private prescription and medication workspace.</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={Colors.subtle}
            accessibilityLabel="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType={mode === 'reset' ? 'send' : 'next'}
            onSubmitEditing={mode === 'reset' ? submit : undefined}
            style={styles.input}
          />

          {mode !== 'reset' ? (
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (at least 8 characters)"
              placeholderTextColor={Colors.subtle}
              accessibilityLabel="Password"
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
              style={styles.input}
            />
          ) : null}

          {message ? (
            <Text
              style={[styles.message, message.isError ? styles.error : styles.success]}
              accessibilityLiveRegion="polite"
            >
              {message.text}
            </Text>
          ) : null}

          <Button label={SUBMIT_LABELS[mode]} onPress={submit} loading={busy} />

          <View style={styles.links}>
            {mode === 'reset' ? (
              <Text onPress={() => switchMode('login')} style={styles.link} accessibilityRole="link">
                Back to sign in
              </Text>
            ) : (
              <>
                <Text
                  onPress={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
                  style={styles.link}
                  accessibilityRole="link"
                >
                  {mode === 'signup' ? 'Already have an account? Sign in' : 'Create an account'}
                </Text>
                <Text onPress={() => switchMode('reset')} style={styles.link} accessibilityRole="link">
                  Forgot password?
                </Text>
              </>
            )}
          </View>

          <Text style={styles.disclaimer}>
            MediMind helps organise prescription information. Always verify medication
            instructions with your clinician or pharmacist.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FA', justifyContent: 'center' },
  wrapper: { width: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brand: { color: Colors.accent, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  title: { color: Colors.ink, fontSize: 28, fontWeight: '800', marginTop: 16 },
  subtitle: { color: Colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  message: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  error: { color: '#B45309' },
  success: { color: Colors.primary },
  links: { gap: 14, marginTop: 20, alignItems: 'center' },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  disclaimer: { color: Colors.subtle, fontSize: 11, lineHeight: 17, marginTop: 24, textAlign: 'center' },
});
