import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setChecking(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const submit = async () => {
    setMessage('');
    if (!email.trim() || (mode !== 'reset' && password.length < 8)) {
      setMessage(mode === 'reset' ? 'Enter your email address.' : 'Enter your email and a password with at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage(data.session ? 'Account created. You are signed in.' : 'Account created. Check your email to confirm your address, then sign in.');
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setMessage('Password reset instructions have been sent if this email is registered.');
      }
    } catch (error: any) { setMessage(error.message || 'Authentication failed. Please try again.'); }
    finally { setBusy(false); }
  };

  if (checking) return <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
  if (session) return <>{children}</>;

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
        <View style={styles.card}>
          <Text style={styles.brand}>MediMind</Text>
          <Text style={styles.title}>{mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>Your private prescription and medication workspace.</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} />
          {mode !== 'reset' && <TextInput value={password} onChangeText={setPassword} placeholder="Password (at least 8 characters)" secureTextEntry style={styles.input} />}
          {!!message && <Text style={styles.message}>{message}</Text>}
          <TouchableOpacity disabled={busy} onPress={submit} style={styles.primary}><Text style={styles.primaryText}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset email' : 'Sign in'}</Text></TouchableOpacity>
          <View style={styles.links}>
            <Text onPress={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); }} style={styles.link}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Create an account'}</Text>
            {mode !== 'reset' && <Text onPress={() => { setMode('reset'); setMessage(''); }} style={styles.link}>Forgot password?</Text>}
            {mode === 'reset' && <Text onPress={() => { setMode('login'); setMessage(''); }} style={styles.link}>Back to sign in</Text>}
          </View>
          <Text style={styles.disclaimer}>MediMind helps organise prescription information. Always verify medication instructions with your clinician or pharmacist.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FA', justifyContent: 'center' },
  wrapper: { width: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 30, borderWidth: 1, borderColor: '#E5EDF2' },
  brand: { color: '#0D9488', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#102A43', fontSize: 28, fontWeight: '800', marginTop: 16 },
  subtitle: { color: '#64788B', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  input: { height: 50, borderWidth: 1, borderColor: '#DCE6EC', borderRadius: 11, paddingHorizontal: 14, marginBottom: 12, color: '#102A43', backgroundColor: '#FFFFFF' },
  message: { color: '#B45309', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  primary: { height: 50, backgroundColor: '#0F766E', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  links: { gap: 14, marginTop: 20, alignItems: 'center' },
  link: { color: '#0F766E', fontSize: 13, fontWeight: '600' },
  disclaimer: { color: '#8293A5', fontSize: 11, lineHeight: 17, marginTop: 24, textAlign: 'center' },
});
