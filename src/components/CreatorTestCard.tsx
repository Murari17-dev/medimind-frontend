import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';

type Evaluation = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  total_pages: number;
  completed_pages: number;
  results: Array<{ page: number; status: string; extraction?: unknown; error?: string }>;
  error?: string | null;
};

const CREATOR_EMAIL = 'murarichaparla10@gmail.com';

export default function CreatorTestCard() {
  const [creator, setCreator] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (active) {
        setCreator(!authError && (data.user?.email || '').trim().toLowerCase() === CREATOR_EMAIL);
        setChecking(false);
      }
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!evaluation || ['completed', 'failed'].includes(evaluation.status)) return;
    const timer = setInterval(async () => {
      try {
        const response = await apiFetch('/api/v1/creator/evaluations/' + evaluation.id);
        if (!response.ok) throw new Error('Could not refresh evaluation status.');
        setEvaluation(await response.json());
      } catch (e: any) {
        setError(e.message || 'Could not refresh evaluation status.');
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [evaluation?.id, evaluation?.status]);

  if (Platform.OS !== 'web' || checking || !creator) return null;

  const choosePdf = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      setError('');
      setEvaluation(null);
      try {
        const body = new FormData();
        body.append('file', file, file.name);
        const response = await apiFetch('/api/v1/creator/evaluations', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Could not start the evaluation.');
        setEvaluation({ ...result, completed_pages: 0, results: [] });
      } catch (e: any) {
        setError(e.message || 'Could not upload this PDF.');
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>CREATOR ONLY</Text>
      <Text style={styles.title}>Test the extraction model</Text>
      <Text style={styles.body}>
        Upload a PDF with up to 100 prescription pages. Each page is processed independently and is kept out of your saved prescription history.
      </Text>
      <TouchableOpacity style={styles.button} onPress={choosePdf} disabled={busy || !!evaluation && !['completed', 'failed'].includes(evaluation.status)}>
        <Text style={styles.buttonText}>{busy ? 'Uploading…' : 'Choose a PDF'}</Text>
      </TouchableOpacity>
      {evaluation && (
        <View style={styles.result}>
          <Text style={styles.body}>
            {evaluation.status === 'completed' ? 'Finished' : evaluation.status === 'failed' ? 'Stopped' : 'Processing'} · {evaluation.completed_pages}/{evaluation.total_pages} pages
          </Text>
          {evaluation.error ? <Text style={styles.error}>{evaluation.error}</Text> : null}
          {evaluation.results.map((item) => (
            <Text key={item.page} style={styles.page}>
              Page {item.page}: {item.status === 'processed' ? JSON.stringify(item.extraction) : item.error}
            </Text>
          ))}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B7D9D4', borderRadius: 16, padding: 18, marginBottom: 24 },
  eyebrow: { color: '#0F766E', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#102A43', fontSize: 17, fontWeight: '800', marginTop: 6 },
  body: { color: '#52677A', fontSize: 12, lineHeight: 18, marginTop: 8 },
  button: { backgroundColor: '#0F766E', borderRadius: 9, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  result: { marginTop: 12 },
  page: { color: '#52677A', fontSize: 10, lineHeight: 15, marginTop: 8 },
  error: { color: '#B42318', fontSize: 12, marginTop: 10 },
});
