import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Disclaimer, PageHeader, Screen, SectionHeader, StateCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import {
  refreshPrescriptions,
  refreshReminders,
  usePrescriptions,
  useReminders,
} from '@/hooks/use-api-data';
import { useUserEmail } from '@/hooks/use-user';

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

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const email = useUserEmail();
  const prescriptions = usePrescriptions();
  const reminders = useReminders();

  const loading = prescriptions.isLoading || reminders.isLoading;
  const refreshing = prescriptions.isValidating || reminders.isValidating;
  const records = prescriptions.data ?? [];
  const medicationCount = records.reduce((total, item) => total + item.medications.length, 0);
  const activeReminders = (reminders.data ?? []).filter((item) => item.enabled).length;
  const latest = records[0];
  const firstName = email?.split('@')[0];

  const refresh = () => {
    void refreshPrescriptions();
    void refreshReminders();
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing && !loading}>
      <PageHeader
        eyebrow={firstName ? `HELLO, ${firstName.toUpperCase()}` : 'YOUR PERSONAL HEALTH SPACE'}
        title={'Healthcare,\nmade simpler.'}
        description="Understand prescriptions and keep your medications organised in one place."
      />

      <View style={styles.scanCard}>
        <Text style={styles.scanEyebrow}>AI PRESCRIPTION SCANNER</Text>
        <Text style={styles.scanTitle}>Have a prescription?</Text>
        <Text style={styles.scanDescription}>
          Upload a photo and MediMind will extract the medication details for you to review.
        </Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/scan')}
          accessibilityRole="button"
          activeOpacity={0.85}
        >
          <Text style={styles.scanButtonText}>Scan a prescription</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Stat value={loading ? '—' : records.length} label="Prescriptions" />
        <Stat value={loading ? '—' : medicationCount} label="Medicines" />
        <Stat value={loading ? '—' : activeReminders} label="Reminders" />
      </View>

      <SectionHeader
        title="Latest prescription"
        actionLabel={records.length > 0 ? 'View all' : undefined}
        onAction={() => router.push('/history')}
      />

      {prescriptions.error ? (
        <StateCard
          title="Could not load your records"
          message={prescriptions.error.message}
          actionLabel="Try again"
          onAction={() => void refreshPrescriptions()}
        />
      ) : loading ? (
        <StateCard loading message="Loading your records..." />
      ) : !latest ? (
        <StateCard
          title="No prescriptions yet"
          message="Scan your first prescription and it will appear here."
        />
      ) : (
        <View style={styles.latestCard}>
          <Text style={styles.latestTitle}>Prescription #{latest.id}</Text>
          <Text style={styles.latestDate}>{formatDate(latest.created_at)}</Text>

          {latest.medications.slice(0, 4).map((medication, index) => (
            <Text key={`${medication.name}-${index}`} style={styles.latestMedication}>
              • {medication.name || 'Unknown medication'}
              {medication.dosage ? ` · ${medication.dosage}` : ''}
            </Text>
          ))}

          {latest.medications.length > 4 ? (
            <Text style={styles.latestMore}>+{latest.medications.length - 4} more</Text>
          ) : null}
        </View>
      )}

      <Disclaimer title="Not a substitute for medical advice">
        AI-extracted information may contain errors. Always verify medication names, dosages
        and instructions with your prescription and pharmacist or doctor.
      </Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scanCard: {
    backgroundColor: Colors.dark,
    borderRadius: 23,
    padding: 24,
    marginBottom: 20,
  },
  scanEyebrow: {
    color: '#A7E8DE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scanTitle: {
    color: Colors.surface,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 14,
  },
  scanDescription: {
    color: Colors.darkText,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    marginBottom: 22,
    maxWidth: 500,
  },
  scanButton: {
    backgroundColor: Colors.mint,
    minHeight: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: { color: '#103B43', fontSize: 15, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  statValue: { color: Colors.ink, fontSize: 26, fontWeight: '800' },
  statLabel: { color: Colors.subtle, fontSize: 12, fontWeight: '600', marginTop: 2 },
  latestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 6,
  },
  latestTitle: { color: Colors.ink, fontSize: 15, fontWeight: '800' },
  latestDate: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  latestMedication: { color: '#52677A', fontSize: 13, lineHeight: 20 },
  latestMore: { color: Colors.subtle, fontSize: 12, marginTop: 2 },
});
