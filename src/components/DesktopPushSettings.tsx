import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '';

function decodeKey(value: string) {
  const padded = value.padEnd(value.length + (4 - value.length % 4) % 4, '=');
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function disableDesktopPush() {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const { data: { session } } = await supabase.auth.getSession();
  try {
    await apiFetch('/api/v1/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
  } finally {
    await subscription.unsubscribe();
    if (session) localStorage.removeItem('medimindPushUser:' + session.user.id);
  }
}

export default function DesktopPushSettings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      return navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setEnabled(
          !!subscription && localStorage.getItem('medimindPushUser:' + session.user.id) === subscription.endpoint
        ));
    })
      .catch(() => setEnabled(false));
  }, []);

  if (Platform.OS !== 'web') return null;

  const toggle = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sign in again to manage notifications.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      if (enabled) {
        await disableDesktopPush();
        setEnabled(false);
        setMessage('Desktop push notifications are turned off.');
      } else {
        if (!VAPID_PUBLIC_KEY) throw new Error('Desktop push is not configured yet.');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') throw new Error('Allow notifications in your browser to continue.');
        const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(VAPID_PUBLIC_KEY),
        });
        const response = await apiFetch('/api/v1/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!response.ok) throw new Error('Could not save this desktop subscription.');
        localStorage.setItem('medimindPushUser:' + session.user.id, subscription.endpoint);
        setEnabled(true);
        setMessage('Reminders can now reach this desktop when the website is closed.');
      }
    } catch (error: any) {
      setMessage(error.message || 'Could not update desktop notifications.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Desktop notifications</Text>
      <Text style={styles.body}>Receive medication reminders through your browser even when MediMind is closed. Your browser must remain installed and notification permission must stay enabled.</Text>
      <TouchableOpacity disabled={busy} onPress={toggle} style={styles.button}>
        <Text style={styles.buttonText}>{busy ? 'Please wait…' : enabled ? 'Turn off desktop notifications' : 'Enable desktop notifications'}</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EDF2', borderRadius: 16, padding: 18, marginBottom: 24 },
  title: { color: '#102A43', fontSize: 16, fontWeight: '800' },
  body: { color: '#52677A', fontSize: 12, lineHeight: 18, marginTop: 7 },
  button: { backgroundColor: '#0F766E', borderRadius: 9, paddingVertical: 12, alignItems: 'center', marginTop: 13 },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  message: { color: '#52677A', fontSize: 11, lineHeight: 16, marginTop: 9 },
});
