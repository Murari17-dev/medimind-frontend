
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiFetch } from '../lib/api';

type Medication = {
  name: string;
  dosage: string;
  instructions: string;
  times_of_day?: string[];
  frequency_per_day?: number | null;
  duration_days?: number | null;
  verification_note?: string | null;
};

type Prescription = {
  id: number;
  doctor_notes?: string;
  medications: Medication[];
};

type Reminder = {
  id: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  reminder_time: string;
  start_date: string;
  end_date: string;
  timezone: string;
  enabled: boolean;
  prescription_id?: number | null;
};

type Proposal = {
  key: string;
  prescriptionId: number;
  medication: Medication;
  times: string;
  startDate: string;
  endDate: string;
  needsTimingReview: boolean;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const prettyTime = (value: string) => String(value).slice(0, 5);

function parseClock(value: string): string | null {
  const s = value.trim();

  let m = s.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);

  if (m) {
    let h = Number(m[1]);
    const minute = Number(m[2]);
    const ap = m[3]?.toUpperCase();

    if (minute > 59 || h > 23 || (ap && (h < 1 || h > 12))) {
      return null;
    }

    if (ap) {
      h = (h % 12) + (ap === 'PM' ? 12 : 0);
    }

    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  m = s.match(/^(\d{1,2})\s*([AP]M)$/i);

  if (m) {
    let h = Number(m[1]);

    if (h < 1 || h > 12) return null;

    h = (h % 12) + (m[2].toUpperCase() === 'PM' ? 12 : 0);

    return `${String(h).padStart(2, '0')}:00`;
  }

  return null;
}

function suggestedTimes(med: Medication): {
  times: string[];
  needsReview: boolean;
} {
  const extracted = (med.times_of_day || [])
    .map(parseClock)
    .filter((v): v is string => !!v);

  if (extracted.length) {
    return {
      times: [...new Set(extracted)].sort(),
      needsReview: false,
    };
  }

  const count = Math.max(
    1,
    Math.min(6, Number(med.frequency_per_day) || 1)
  );

  const defaults: Record<number, string[]> = {
    1: ['08:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '14:00', '20:00'],
    4: ['06:00', '12:00', '18:00', '22:00'],
  };

  const times =
    defaults[count] ||
    Array.from({ length: count }, (_, i) => {
      const minutes =
        8 * 60 + Math.round((14 * 60 * i) / Math.max(1, count - 1));

      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    });

  return { times, needsReview: true };
}

export default function RemindersScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [items, setItems] = useState<Reminder[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [prescriptionResponse, reminderResponse] = await Promise.all([
        apiFetch('/api/v1/prescriptions'),
        apiFetch('/api/v1/reminders'),
      ]);

      if (!prescriptionResponse.ok) {
        throw new Error('Could not load your saved prescriptions.');
      }

      if (!reminderResponse.ok) {
        throw new Error('Could not load your existing reminders.');
      }

      const prescriptionData: Prescription[] =
        await prescriptionResponse.json();

      const reminderData: Reminder[] =
        await reminderResponse.json();

      setPrescriptions(prescriptionData);
      setItems(reminderData);

      const now = today();
      const pending: Proposal[] = [];

      prescriptionData.forEach((prescription) => {
        (prescription.medications || []).forEach((medication, index) => {
          const { times, needsReview } = suggestedTimes(medication);

          const missing = times.filter((time) =>
            !reminderData.some((r) =>
              r.prescription_id === prescription.id &&
              r.medication_name.trim().toLowerCase() ===
                medication.name.trim().toLowerCase() &&
              prettyTime(r.reminder_time) === time &&
              r.enabled
            )
          );

          if (missing.length) {
            pending.push({
              key: `${prescription.id}-${index}`,
              prescriptionId: prescription.id,
              medication,
              times: missing.join(', '),
              startDate: now,
              endDate:
                medication.duration_days && medication.duration_days > 0
                  ? addDays(now, medication.duration_days - 1)
                  : '',
              needsTimingReview: needsReview,
            });
          }
        });
      });

      setProposals(pending);
    } catch (e: any) {
      setError(e.message || 'Could not connect to MediMind.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateProposal = (
    key: string,
    patch: Partial<Proposal>
  ) => {
    setProposals((current) =>
      current.map((p) =>
        p.key === key ? { ...p, ...patch } : p
      )
    );
  };

  const confirmProposal = async (proposal: Proposal) => {
    const times = proposal.times
      .split(',')
      .map((t) => t.trim());

    if (
      !times.length ||
      times.some(
        (t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)
      )
    ) {
      Alert.alert(
        'Check reminder times',
        'Use 24-hour times separated by commas, such as 08:00, 20:00.'
      );
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(proposal.startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(proposal.endDate) ||
      proposal.endDate < proposal.startDate
    ) {
      Alert.alert(
        'Confirm the treatment dates',
        'Enter a valid start and end date. We do not assume a duration when the prescription does not provide one.'
      );
      return;
    }

    setSaving(true);

    try {
      for (const time of [...new Set(times)]) {
        const response = await apiFetch('/api/v1/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medication_name: proposal.medication.name,
            dosage: proposal.medication.dosage || '',
            instructions: proposal.medication.instructions || '',
            reminder_time: `${time}:00`,
            start_date: proposal.startDate,
            end_date: proposal.endDate,
            timezone: 'Asia/Kolkata',
            prescription_id: proposal.prescriptionId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.detail || `Could not create ${time} reminder.`
          );
        }
      }

      setProposals((current) =>
        current.filter((p) => p.key !== proposal.key)
      );

      await load();
    } catch (e: any) {
      Alert.alert(
        'Could not create schedule',
        e.message || 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (
    item: Reminder,
    enabled: boolean
  ) => {
    try {
      const response = await apiFetch(
        `/api/v1/reminders/${item.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        }
      );

      if (!response.ok) {
        throw new Error('Update failed');
      }

      await load();
    } catch {
      Alert.alert(
        'Could not update reminder',
        'Please try again.'
      );
    }
  };

  const remove = (item: Reminder) => {
    const run = async () => {
      const response = await apiFetch(
        `/api/v1/reminders/${item.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        Alert.alert('Delete failed', 'Please try again.');
        return;
      }

      await load();
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(
          `Delete the reminder for ${item.medication_name}?`
        )
      ) {
        void run();
      }
    } else {
      Alert.alert(
        'Delete reminder?',
        `Remove ${item.medication_name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void run(),
          },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>MEDICATION SCHEDULE</Text>

      <Text style={styles.title}>Reminders.</Text>

      <Text style={styles.subtitle}>
        MediMind reads your saved prescriptions and prepares reminder
        schedules for you to review.
      </Text>

      {loading ? (
        <ActivityIndicator
          color="#0D9488"
          size="large"
          style={{ marginTop: 28 }}
        />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.actionText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>
              {prescriptions.reduce(
                (n, p) => n + (p.medications || []).length,
                0
              )}
            </Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>
                Medication entries found
              </Text>
              <Text style={styles.summarySub}>
                Across {prescriptions.length} saved prescriptions
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Schedules to review
            </Text>
            <TouchableOpacity onPress={() => void load()}>
              <Text style={styles.actionText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {proposals.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.cardTitle}>
                You're up to date
              </Text>
              <Text style={styles.subtitle}>
                No new prescription-based schedules need confirmation.
                New scans will appear here.
              </Text>
            </View>
          ) : (
            proposals.map((p) => (
              <View key={p.key} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {p.medication.name}
                </Text>

                <Text style={styles.dosage}>
                  {p.medication.dosage || 'Dosage not recorded'}
                  {' · '}
                  Prescription #{p.prescriptionId}
                </Text>

                {!!p.medication.instructions && (
                  <Text style={styles.instructions}>
                    {p.medication.instructions}
                  </Text>
                )}

                <Text style={styles.label}>
                  PROPOSED TIMES (24-HOUR, COMMA-SEPARATED)
                </Text>

                <TextInput
                  value={p.times}
                  onChangeText={(v) =>
                    updateProposal(p.key, { times: v })
                  }
                  style={styles.input}
                  placeholder="08:00, 20:00"
                />

                {p.needsTimingReview && (
                  <Text style={styles.warning}>
                    The prescription did not provide exact clock times.
                    These are editable placeholders based on the extracted
                    frequency, not medical instructions. Confirm the timing
                    with your prescription or pharmacist.
                  </Text>
                )}

                {!!p.medication.verification_note && (
                  <Text style={styles.warning}>
                    Prescription extraction note:{' '}
                    {p.medication.verification_note}
                  </Text>
                )}

                <Text style={styles.label}>
                  START DATE (CONFIRM WHEN YOU STARTED)
                </Text>

                <TextInput
                  value={p.startDate}
                  onChangeText={(v) =>
                    updateProposal(p.key, { startDate: v })
                  }
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                />

                <Text style={styles.label}>
                  END DATE{' '}
                  {p.medication.duration_days
                    ? `(EXTRACTED ${p.medication.duration_days}-DAY DURATION — CONFIRM)`
                    : '(NOT SPECIFIED — REQUIRED)'}
                </Text>

                <TextInput
                  value={p.endDate}
                  onChangeText={(v) =>
                    updateProposal(p.key, { endDate: v })
                  }
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                />

                <TouchableOpacity
                  disabled={saving}
                  onPress={() => void confirmProposal(p)}
                  style={styles.primary}
                >
                  <Text style={styles.primaryText}>
                    {saving ? 'Saving…' : 'Confirm this schedule'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Active reminders
            </Text>

            <TouchableOpacity onPress={() => void load()}>
              <Text style={styles.actionText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.subtitle}>
                No confirmed reminders yet.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {item.medication_name}
                    </Text>

                    <Text style={styles.dosage}>
                      {item.dosage || 'Dosage not entered'}
                      {' · '}
                      {prettyTime(item.reminder_time)}
                    </Text>
                  </View>

                  <Text
                    style={
                      item.enabled
                        ? styles.enabled
                        : styles.paused
                    }
                  >
                    {item.enabled ? 'Enabled' : 'Paused'}
                  </Text>
                </View>

                {!!item.instructions && (
                  <Text style={styles.instructions}>
                    {item.instructions}
                  </Text>
                )}

                <Text style={styles.dates}>
                  {item.start_date} — {item.end_date}
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      void toggle(item, !item.enabled)
                    }
                  >
                    <Text style={styles.actionText}>
                      {item.enabled ? 'Pause' : 'Enable'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => remove(item)}>
                    <Text
                      style={[
                        styles.actionText,
                        { color: '#B91C1C' },
                      ]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      <Text style={styles.disclaimer}>
        Reminders are prompts, not medical advice. Medication timing
        and duration must be reviewed and confirmed before reminders
        are activated. MediMind does not record whether a dose was taken.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 14,
  },
  title: {
    color: '#102A43',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#627D98',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  summary: {
    backgroundColor: '#123B49',
    borderRadius: 16,
    padding: 20,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  summarySub: {
    color: '#C3D4D8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 21,
    color: '#102A43',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5EDF2',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: '800',
  },
  dosage: {
    color: '#0F766E',
    fontWeight: '700',
    marginTop: 5,
  },
  instructions: {
    color: '#486581',
    marginTop: 10,
  },
  label: {
    color: '#627D98',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#102A43',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  warning: {
    color: '#92400E',
    backgroundColor: '#FFFBEB',
    borderRadius: 9,
    padding: 11,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  primary: {
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  empty: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EDF2',
  },
  error: {
    color: '#B91C1C',
    paddingBottom: 12,
  },
  actionText: {
    color: '#0F766E',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enabled: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '800',
  },
  paused: {
    color: '#829AB1',
    fontSize: 12,
    fontWeight: '800',
  },
  dates: {
    color: '#829AB1',
    fontSize: 12,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  disclaimer: {
    color: '#829AB1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
  },
});
