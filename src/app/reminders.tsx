import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button, Disclaimer, PageHeader, Screen, SectionHeader, StateCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import {
  REMINDERS_KEY,
  refreshReminders,
  usePrescriptions,
  useReminders,
} from '@/hooks/use-api-data';
import { apiJson, jsonRequest } from '@/lib/api';
import { confirmAction, notify } from '@/lib/feedback';
import {
  addDays,
  getDeviceTimezone,
  prettyTime,
  suggestedTimes,
  today,
} from '@/lib/reminder-times';
import type { Medication, Prescription, Reminder } from '@/lib/types';

type Proposal = {
  key: string;
  prescriptionId: number;
  medication: Medication;
  times: string;
  startDate: string;
  endDate: string;
  needsTimingReview: boolean;
};

type ProposalEdit = {
  base: string;
  values: Partial<Pick<Proposal, 'times' | 'startDate' | 'endDate'>>;
};

const CLOCK_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function buildProposals(prescriptions: Prescription[], reminders: Reminder[]): Proposal[] {
  const start = today();
  const proposals: Proposal[] = [];

  prescriptions.forEach((prescription) => {
    prescription.medications.forEach((medication, index) => {
      const { times, needsReview } = suggestedTimes(medication);
      const name = medication.name.trim().toLowerCase();

      const missing = times.filter(
        (time) =>
          !reminders.some(
            (r) =>
              r.enabled &&
              r.prescription_id === prescription.id &&
              r.medication_name.trim().toLowerCase() === name &&
              prettyTime(r.reminder_time) === time,
          ),
      );

      if (missing.length === 0) return;

      const duration = medication.duration_days ?? 0;

      proposals.push({
        key: `${prescription.id}-${index}`,
        prescriptionId: prescription.id,
        medication,
        times: missing.join(', '),
        startDate: start,
        endDate: duration > 0 ? addDays(start, duration - 1) : '',
        needsTimingReview: needsReview,
      });
    });
  });

  return proposals;
}

export default function RemindersScreen() {
  const prescriptions = usePrescriptions();
  const reminders = useReminders();
  const [edits, setEdits] = useState<Record<string, ProposalEdit>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const reminderList = useMemo(() => reminders.data ?? [], [reminders.data]);
  const prescriptionList = useMemo(() => prescriptions.data ?? [], [prescriptions.data]);

  // Drafts are layered over the suggestions. An edit only applies while the
  // suggestion it was based on is unchanged, so a background refresh never
  // wipes what someone is typing, but a changed suggestion starts fresh.
  const proposals = useMemo(
    () =>
      buildProposals(prescriptionList, reminderList).map((proposal) => {
        const edit = edits[proposal.key];
        return edit && edit.base === proposal.times ? { ...proposal, ...edit.values } : proposal;
      }),
    [prescriptionList, reminderList, edits],
  );

  const loading = prescriptions.isLoading || reminders.isLoading;
  const loadError = prescriptions.error || reminders.error;
  const medicationCount = prescriptionList.reduce((n, p) => n + p.medications.length, 0);

  const reload = () => {
    void prescriptions.mutate();
    void refreshReminders();
  };

  const updateProposal = (proposal: Proposal, patch: Partial<Proposal>) => {
    setEdits((current) => {
      const previous = current[proposal.key];
      const base = previous?.base ?? suggestedTimesFor(proposal.key);
      return {
        ...current,
        [proposal.key]: { base, values: { ...previous?.values, ...patch } },
      };
    });
  };

  const suggestedTimesFor = (key: string) =>
    buildProposals(prescriptionList, reminderList).find((p) => p.key === key)?.times ?? '';

  const confirmProposal = async (proposal: Proposal) => {
    const times = [...new Set(proposal.times.split(',').map((t) => t.trim()))];

    if (times.length === 0 || times.some((t) => !CLOCK_PATTERN.test(t))) {
      notify(
        'Check reminder times',
        'Use 24-hour times separated by commas, such as 08:00, 20:00.',
      );
      return;
    }

    if (
      !DATE_PATTERN.test(proposal.startDate) ||
      !DATE_PATTERN.test(proposal.endDate) ||
      proposal.endDate < proposal.startDate
    ) {
      notify(
        'Confirm the treatment dates',
        'Enter a valid start and end date. We do not assume a duration when the prescription does not provide one.',
      );
      return;
    }

    setSavingKey(proposal.key);

    try {
      for (const time of times) {
        await apiJson(
          REMINDERS_KEY,
          jsonRequest('POST', {
            medication_name: proposal.medication.name,
            dosage: proposal.medication.dosage || '',
            instructions: proposal.medication.instructions || '',
            reminder_time: `${time}:00`,
            start_date: proposal.startDate,
            end_date: proposal.endDate,
            timezone: getDeviceTimezone(),
            prescription_id: proposal.prescriptionId,
          }),
          `Could not create the ${time} reminder.`,
        );
      }
    } catch (error: any) {
      notify('Could not create schedule', error?.message || 'Please try again.');
    } finally {
      // Refresh even after a failure so any reminders that were created show up.
      await refreshReminders();
      setSavingKey(null);
    }
  };

  const toggle = async (item: Reminder) => {
    try {
      await apiJson(
        `${REMINDERS_KEY}/${item.id}`,
        jsonRequest('PATCH', { enabled: !item.enabled }),
        'Could not update this reminder.',
      );
      await refreshReminders();
    } catch (error: any) {
      notify('Could not update reminder', error?.message || 'Please try again.');
    }
  };

  const remove = async (item: Reminder) => {
    const confirmed = await confirmAction({
      title: 'Delete reminder?',
      message: `Remove the reminder for ${item.medication_name}?`,
    });

    if (!confirmed) return;

    try {
      await apiJson(`${REMINDERS_KEY}/${item.id}`, { method: 'DELETE' }, 'Delete failed.');
      await refreshReminders();
    } catch (error: any) {
      notify('Delete failed', error?.message || 'Please try again.');
    }
  };

  return (
    <Screen onRefresh={reload} refreshing={(prescriptions.isValidating || reminders.isValidating) && !loading}>
      <PageHeader
        eyebrow="MEDICATION SCHEDULE"
        title="Reminders."
        description="MediMind reads your saved prescriptions and prepares reminder schedules for you to review."
      />

      {loading ? (
        <StateCard loading message="Loading your schedules..." />
      ) : loadError ? (
        <StateCard
          title="Could not load reminders"
          message={loadError.message}
          actionLabel="Try again"
          onAction={reload}
        />
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>{medicationCount}</Text>
            <View style={styles.flex}>
              <Text style={styles.summaryTitle}>Medication entries found</Text>
              <Text style={styles.summarySub}>
                Across {prescriptionList.length} saved prescriptions
              </Text>
            </View>
          </View>

          <SectionHeader title="Schedules to review" actionLabel="Refresh" onAction={reload} />

          {proposals.length === 0 ? (
            <StateCard
              title="You're up to date"
              message="No new prescription-based schedules need confirmation. New scans will appear here."
            />
          ) : (
            proposals.map((p) => (
              <View key={p.key} style={styles.card}>
                <Text style={styles.cardTitle}>{p.medication.name || 'Unknown medication'}</Text>
                <Text style={styles.dosage}>
                  {p.medication.dosage || 'Dosage not recorded'} · Prescription #{p.prescriptionId}
                </Text>

                {p.medication.instructions ? (
                  <Text style={styles.instructions}>{p.medication.instructions}</Text>
                ) : null}

                <Text style={styles.label}>PROPOSED TIMES (24-HOUR, COMMA-SEPARATED)</Text>
                <TextInput
                  value={p.times}
                  onChangeText={(v) => updateProposal(p, { times: v })}
                  style={styles.input}
                  placeholder="08:00, 20:00"
                  placeholderTextColor={Colors.subtle}
                  accessibilityLabel={`Reminder times for ${p.medication.name}`}
                  autoCorrect={false}
                />

                {p.needsTimingReview ? (
                  <Text style={styles.warning}>
                    The prescription did not provide exact clock times. These are editable
                    placeholders, not medical instructions. Confirm the timing with your
                    prescription or pharmacist.
                  </Text>
                ) : null}

                {p.medication.verification_note ? (
                  <Text style={styles.warning}>
                    Prescription extraction note: {p.medication.verification_note}
                  </Text>
                ) : null}

                <Text style={styles.label}>START DATE (CONFIRM WHEN YOU STARTED)</Text>
                <TextInput
                  value={p.startDate}
                  onChangeText={(v) => updateProposal(p, { startDate: v })}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.subtle}
                  accessibilityLabel={`Start date for ${p.medication.name}`}
                  autoCorrect={false}
                />

                <Text style={styles.label}>
                  END DATE{' '}
                  {p.medication.duration_days
                    ? `(EXTRACTED ${p.medication.duration_days}-DAY DURATION — CONFIRM)`
                    : '(NOT SPECIFIED — REQUIRED)'}
                </Text>
                <TextInput
                  value={p.endDate}
                  onChangeText={(v) => updateProposal(p, { endDate: v })}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.subtle}
                  accessibilityLabel={`End date for ${p.medication.name}`}
                  autoCorrect={false}
                />

                <View style={styles.confirm}>
                  <Button
                    label="Confirm this schedule"
                    onPress={() => void confirmProposal(p)}
                    loading={savingKey === p.key}
                    disabled={savingKey !== null}
                  />
                </View>
              </View>
            ))
          )}

          <SectionHeader title="Active reminders" />

          {reminderList.length === 0 ? (
            <StateCard message="No confirmed reminders yet." />
          ) : (
            reminderList.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{item.medication_name}</Text>
                    <Text style={styles.dosage}>
                      {item.dosage || 'Dosage not entered'} · {prettyTime(item.reminder_time)}
                    </Text>
                  </View>
                  <Text style={item.enabled ? styles.enabled : styles.paused}>
                    {item.enabled ? 'Enabled' : 'Paused'}
                  </Text>
                </View>

                {item.instructions ? (
                  <Text style={styles.instructions}>{item.instructions}</Text>
                ) : null}

                <Text style={styles.dates}>
                  {item.start_date} — {item.end_date} · {item.timezone}
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => void toggle(item)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text style={styles.actionText}>{item.enabled ? 'Pause' : 'Enable'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void remove(item)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text style={[styles.actionText, styles.destructive]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      <Disclaimer>
        Reminders are prompts, not medical advice. Medication timing and duration must be
        reviewed and confirmed before reminders are activated. MediMind does not record whether
        a dose was taken. Reminders appear while the app is open.
      </Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: {
    backgroundColor: Colors.dark,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryNumber: { color: Colors.surface, fontSize: 36, fontWeight: '800' },
  summaryTitle: { color: Colors.surface, fontWeight: '800', fontSize: 15 },
  summarySub: { color: Colors.darkText, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardTitle: { color: Colors.ink, fontSize: 17, fontWeight: '800' },
  dosage: { color: Colors.primary, fontWeight: '700', marginTop: 5 },
  instructions: { color: '#486581', marginTop: 10 },
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
    color: Colors.ink,
    backgroundColor: Colors.surface,
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
  confirm: { marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  enabled: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  paused: { color: '#829AB1', fontSize: 12, fontWeight: '800' },
  dates: { color: '#829AB1', fontSize: 12, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 20, marginTop: 14 },
  actionText: { color: Colors.primary, fontWeight: '700' },
  destructive: { color: '#B91C1C' },
});
