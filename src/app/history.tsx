import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Disclaimer, PageHeader, Screen, SectionHeader, StateCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { PRESCRIPTIONS_KEY, usePrescriptions } from '@/hooks/use-api-data';
import { apiJson } from '@/lib/api';
import { confirmAction, notify } from '@/lib/feedback';

const PREVIEW_LIMIT = 4;

const formatDate = (date?: string | null) => {
  if (!date) return 'Saved prescription';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Saved prescription';

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function HistoryScreen() {
  const { data, error, isLoading, isValidating, mutate } = usePrescriptions();
  const [deletingId, setDeletingId] = useState<number | 'all' | null>(null);

  const prescriptions = data ?? [];
  const medicationCount = prescriptions.reduce((total, item) => total + item.medications.length, 0);
  const busy = deletingId !== null;

  const deletePrescription = async (id: number) => {
    const confirmed = await confirmAction({
      title: 'Delete this prescription?',
      message:
        'Its saved medication entries will also be deleted. Any reminders you created from it are kept.',
    });

    if (!confirmed) return;

    setDeletingId(id);
    try {
      await apiJson(
        `${PRESCRIPTIONS_KEY}/${id}`,
        { method: 'DELETE' },
        'Unable to delete this prescription.',
      );
      await mutate((current) => current?.filter((item) => item.id !== id), {
        revalidate: false,
      });
    } catch (err: any) {
      notify('Deletion failed', err?.message || 'Could not delete this prescription.');
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    const confirmed = await confirmAction({
      title: 'Delete all prescriptions?',
      message:
        'This permanently deletes every prescription in your account and its medication records. Your reminders are kept.',
      confirmLabel: 'Delete all',
    });

    if (!confirmed) return;

    setDeletingId('all');
    try {
      await apiJson(PRESCRIPTIONS_KEY, { method: 'DELETE' }, 'Unable to clear prescription history.');
      await mutate([], { revalidate: false });
    } catch (err: any) {
      notify('Could not clear history', err?.message || 'Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Screen onRefresh={() => void mutate()} refreshing={isValidating && !isLoading}>
      <PageHeader
        eyebrow="YOUR RECORDS"
        title="Prescription history."
        description="All your previously scanned prescriptions, organised in one place."
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{isLoading ? '—' : prescriptions.length}</Text>
          <Text style={styles.summaryLabel}>Prescriptions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{isLoading ? '—' : medicationCount}</Text>
          <Text style={styles.summaryLabel}>Medication entries</Text>
        </View>
      </View>

      <SectionHeader
        title="Recent activity"
        actionLabel="Refresh"
        onAction={() => void mutate()}
      />

      {isLoading ? (
        <StateCard loading message="Loading your records..." />
      ) : error ? (
        <StateCard
          title="Unable to load history"
          message={error.message}
          actionLabel="Try again"
          onAction={() => void mutate()}
        />
      ) : prescriptions.length === 0 ? (
        <StateCard
          title="No prescriptions yet"
          message="Your scanned prescriptions will appear here after you upload them."
        />
      ) : (
        <>
          {prescriptions.map((prescription) => (
            <View key={prescription.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Prescription #{prescription.id}</Text>
                  <Text style={styles.cardDate}>{formatDate(prescription.created_at)}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {prescription.medications.length}{' '}
                    {prescription.medications.length === 1 ? 'medicine' : 'medicines'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {prescription.medications.slice(0, PREVIEW_LIMIT).map((medication, index) => (
                <View key={`${medication.name}-${index}`} style={styles.medicationRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.medicationName} numberOfLines={1}>
                    {medication.name || 'Unknown medication'}
                  </Text>
                  <Text style={styles.dosage}>{medication.dosage || '—'}</Text>
                </View>
              ))}

              {prescription.medications.length > PREVIEW_LIMIT ? (
                <Text style={styles.more}>
                  +{prescription.medications.length - PREVIEW_LIMIT} more medications
                </Text>
              ) : null}

              {prescription.doctor_notes ? (
                <View style={styles.notes}>
                  <Text style={styles.notesLabel}>DOCTOR&apos;S NOTES</Text>
                  <Text style={styles.notesText}>{prescription.doctor_notes}</Text>
                </View>
              ) : null}

              <View style={styles.cardAction}>
                <Button
                  label="Delete prescription"
                  variant="danger"
                  onPress={() => void deletePrescription(prescription.id)}
                  loading={deletingId === prescription.id}
                  disabled={busy}
                />
              </View>
            </View>
          ))}

          <Button
            label="Clear all history"
            variant="secondary"
            onPress={() => void clearAll()}
            loading={deletingId === 'all'}
            disabled={busy}
          />
        </>
      )}

      <Disclaimer title="Your health records matter">
        Extracted prescription details may contain errors. Keep your original prescription and
        verify medication instructions with your clinician.
      </Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  summaryNumber: { color: Colors.ink, fontSize: 28, fontWeight: '800' },
  summaryLabel: { color: Colors.subtle, fontSize: 12, fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { color: Colors.ink, fontSize: 15, fontWeight: '800' },
  cardDate: { color: Colors.subtle, fontSize: 12, marginTop: 3 },
  badge: {
    backgroundColor: Colors.tint,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#EEF3F6', marginVertical: 14 },
  medicationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  medicationName: { flex: 1, color: Colors.ink, fontSize: 13, fontWeight: '700' },
  dosage: { color: Colors.muted, fontSize: 12 },
  more: { color: Colors.subtle, fontSize: 12, marginTop: 6 },
  notes: { backgroundColor: Colors.noticeTint, borderRadius: 11, padding: 13, marginTop: 14 },
  notesLabel: {
    color: '#9A6B15',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },
  notesText: { color: Colors.notice, fontSize: 12, lineHeight: 19 },
  cardAction: { marginTop: 16 },
});
