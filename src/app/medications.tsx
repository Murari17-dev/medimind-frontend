import { apiFetch } from '../lib/api';

import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  times_of_day: string[];
  verification_note?: string;
}

interface Prescription {
  id?: number;
  doctor_notes?: string;
  medications: Medication[];
}

export default function MedicationsScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMedications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/prescriptions');

      if (!response.ok) {
        throw new Error('Unable to retrieve medication records.');
      }

      const data = await response.json();
      setPrescriptions(data);
    } catch (err: any) {
      setError(err.message || 'Could not connect to MediMind.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  const medications = prescriptions.flatMap((prescription) =>
    (prescription.medications || []).map((medication) => ({
      ...medication,
      prescriptionId: prescription.id,
    }))
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>MEDICATION LIBRARY</Text>
      <Text style={styles.title}>Your medications.</Text>
      <Text style={styles.description}>
        A consolidated view of medicines extracted from your saved prescriptions.
      </Text>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>SAVED MEDICATION ENTRIES</Text>
          <Text style={styles.summaryNumber}>
            {loading ? '—' : medications.length}
          </Text>
          <Text style={styles.summaryCaption}>
            Across {prescriptions.length} prescriptions
          </Text>
        </View>
        <View style={styles.summaryIcon}>
          <Text style={styles.summaryIconText}>✚</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>All medications</Text>
          <Text style={styles.sectionSubtitle}>
            Extracted from your prescription history
          </Text>
        </View>

        <TouchableOpacity onPress={loadMedications} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#0D9488" size="large" />
          <Text style={styles.stateText}>Loading medication records...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Unable to load records</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMedications}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : medications.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.emptyIcon}>✚</Text>
          <Text style={styles.stateTitle}>No medications yet</Text>
          <Text style={styles.stateText}>
            Upload a prescription using the Scan section to see extracted
            medications here.
          </Text>
        </View>
      ) : (
        medications.map((medication, index) => (
          <View
            key={`${medication.prescriptionId}-${index}`}
            style={styles.medicationCard}
          >
            <View style={styles.medicationHeader}>
              <View style={styles.medicationIcon}>
                <Text style={styles.medicationInitials}>
                  {getInitials(medication.name)}
                </Text>
              </View>

              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{medication.name}</Text>
                <Text style={styles.medicationDosage}>{medication.dosage}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.detailLabel}>INSTRUCTIONS</Text>
            <Text style={styles.detailText}>
              {medication.instructions || 'No instructions recorded.'}
            </Text>

            {medication.times_of_day?.length > 0 && (
              <View style={styles.timeRow}>
                {medication.times_of_day.map((time, idx) => (
                  <View style={styles.timeBadge} key={idx}>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                ))}
              </View>
            )}

            {medication.verification_note ? (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  {medication.verification_note}
                </Text>
              </View>
            ) : null}

            <Text style={styles.sourceText}>
              Prescription #{medication.prescriptionId}
            </Text>
          </View>
        ))
      )}

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>A quick reminder</Text>
        <Text style={styles.disclaimerText}>
          These records are extracted from prescription images. They are not
          confirmation that a medicine is currently prescribed or should be
          taken. Always follow your clinician's instructions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 24,
    paddingBottom: 50,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 12,
  },
  title: {
    color: '#102A43',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 12,
  },
  description: {
    color: '#64788B',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 25,
  },
  summaryCard: {
    backgroundColor: '#123B49',
    borderRadius: 20,
    padding: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  summaryLabel: {
    color: '#A7E8DE',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: '800',
    marginTop: 7,
  },
  summaryCaption: {
    color: '#C3D4D8',
    fontSize: 11,
    marginTop: 4,
  },
  summaryIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: '#245966',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconText: {
    color: '#83E0D2',
    fontSize: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#102A43',
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8293A5',
    fontSize: 11,
    marginTop: 4,
  },
  refreshButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#E6F5F1',
  },
  refreshText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '800',
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 27,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  stateTitle: {
    color: '#102A43',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  stateText: {
    color: '#8293A5',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyIcon: {
    color: '#0D9488',
    fontSize: 32,
  },
  retryButton: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 17,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#E6F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  medicationInitials: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '800',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  medicationDosage: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F5',
    marginVertical: 15,
  },
  detailLabel: {
    color: '#8293A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailText: {
    color: '#52677A',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  timeBadge: {
    backgroundColor: '#EAF5F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    color: '#187B78',
    fontSize: 11,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#FFF3E9',
    borderRadius: 9,
    padding: 11,
    marginTop: 12,
  },
  warningText: {
    color: '#A65320',
    fontSize: 11,
    lineHeight: 17,
  },
  sourceText: {
    color: '#9AA8B5',
    fontSize: 10,
    marginTop: 14,
  },
  disclaimerCard: {
    backgroundColor: '#EDF6F5',
    borderRadius: 14,
    padding: 17,
    marginTop: 23,
  },
  disclaimerTitle: {
    color: '#164E50',
    fontSize: 13,
    fontWeight: '800',
  },
  disclaimerText: {
    color: '#526D72',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },
});
