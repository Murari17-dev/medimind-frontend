import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useDueReminders } from '@/hooks/use-api-data';
import { notify } from '@/lib/feedback';
import type { DueReminder } from '@/lib/types';

const VISIBLE_LIMIT = 3;

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function DueRemindersBanner() {
  const insets = useSafeAreaInsets();
  const { data, acknowledge, mutate } = useDueReminders();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const items = data ?? [];
  if (items.length === 0) return null;

  const keyOf = (item: DueReminder) => `${item.id}-${item.scheduled_for}`;

  const dismiss = async (targets: DueReminder[]) => {
    setBusyKey(targets.length === 1 ? keyOf(targets[0]) : 'all');

    let failureMessage: string | undefined;
    try {
      // Defer SWR revalidation until the batch finishes. Revalidating after
      // every item adds one unnecessary GET per reminder.
      for (const item of targets) {
        await acknowledge(item, false);
      }
    } catch (error: any) {
      failureMessage = error?.message || 'Please try again.';
    }

    try {
      await mutate();
    } catch (error: any) {
      failureMessage ??= error?.message || 'Please try again.';
    } finally {
      setBusyKey(null);
    }

    if (failureMessage) {
      notify('Could not update reminder', failureMessage);
    }
  };

  const visible = items.slice(0, VISIBLE_LIMIT);
  const hidden = items.length - visible.length;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 10 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.titleRow}>
        <Ionicons name="alarm-outline" size={18} color={Colors.mint} />
        <Text style={styles.title}>
          {items.length === 1 ? '1 reminder' : `${items.length} reminders`}
        </Text>
        {items.length > 1 ? (
          <TouchableOpacity
            onPress={() => void dismiss(items)}
            disabled={busyKey !== null}
            accessibilityRole="button"
            accessibilityLabel="Dismiss all reminders"
            hitSlop={8}
          >
            <Text style={styles.dismissAll}>Dismiss all</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {visible.map((item) => (
        <View key={keyOf(item)} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.name} numberOfLines={1}>
              {item.medication_name}
              {item.dosage ? ` · ${item.dosage}` : ''}
            </Text>
            <Text style={styles.meta}>
              {item.occurrence_status === 'missed' ? 'Missed' : 'Due now'} ·{' '}
              {formatTime(item.scheduled_for)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dismiss}
            onPress={() => void dismiss([item])}
            disabled={busyKey !== null}
            accessibilityRole="button"
            accessibilityLabel={`Dismiss reminder for ${item.medication_name}`}
          >
            <Text style={styles.dismissText}>
              {busyKey === keyOf(item) ? 'Saving…' : 'Dismiss'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {hidden > 0 ? <Text style={styles.more}>+{hidden} more</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { color: Colors.surface, fontSize: 14, fontWeight: '800', flex: 1 },
  dismissAll: { color: Colors.mint, fontSize: 12, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2B5663',
  },
  rowText: { flex: 1 },
  name: { color: Colors.surface, fontSize: 14, fontWeight: '700' },
  meta: { color: Colors.darkText, fontSize: 12, marginTop: 2 },
  dismiss: {
    backgroundColor: Colors.mint,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dismissText: { color: '#103B43', fontSize: 12, fontWeight: '800' },
  more: { color: Colors.darkText, fontSize: 12, marginTop: 6 },
});
