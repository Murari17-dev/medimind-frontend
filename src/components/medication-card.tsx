import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Medication } from '@/lib/types';

export function MedicationCard({
  medication,
  footer,
}: {
  medication: Medication;
  footer?: string;
}) {
  const times = medication.times_of_day ?? [];
  const name = medication.name || 'Unknown medication';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.dosage}>{medication.dosage || 'Dosage not recorded'}</Text>
        </View>
      </View>

      {medication.instructions ? (
        <Text style={styles.instructions}>{medication.instructions}</Text>
      ) : null}

      {times.length > 0 ? (
        <View style={styles.times}>
          {times.map((time, index) => (
            <View style={styles.timeBadge} key={`${time}-${index}`}>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {medication.verification_note ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>{medication.verification_note}</Text>
        </View>
      ) : null}

      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
  info: { flex: 1 },
  name: { color: Colors.ink, fontSize: 16, fontWeight: '800' },
  dosage: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginTop: 3 },
  instructions: { color: '#52677A', fontSize: 13, lineHeight: 20, marginTop: 12 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  timeBadge: {
    backgroundColor: '#EAF5F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: { color: '#187B78', fontSize: 11, fontWeight: '700' },
  warning: {
    backgroundColor: Colors.warningTint,
    padding: 11,
    borderRadius: 9,
    marginTop: 12,
  },
  warningText: { color: Colors.warning, fontSize: 12, lineHeight: 18 },
  footer: { color: Colors.subtle, fontSize: 11, marginTop: 12 },
});
