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
}

interface Prescription {
  id: number;
  doctor_notes?: string;
  medications: Medication[];
  created_at?: string;
}

export default function HistoryScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/prescriptions');

      if (!response.ok) {
        throw new Error('Unable to load prescription history.');
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
    loadHistory();
  }, []);

  const formatDate = (date?: string) => {
    if (!date) return 'Saved prescription';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return 'Saved prescription';

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>YOUR RECORDS</Text>
      <Text style={styles.title}>Prescription history.</Text>
      <Text style={styles.description}>
        All your previously scanned prescriptions, organised in one place.
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {loading ? '—' : prescriptions.length}
          </Text>
          <Text style={styles.summaryLabel}>Prescriptions</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {loading
              ? '—'
              : prescriptions.reduce(
                  (total, item) => total + (item.medications?.length || 0),
                  0
                )}
          </Text>
          <Text style={styles.summaryLabel}>Medication entries</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <TouchableOpacity onPress={loadHistory}>
          <Text style={styles.refreshText}>Refresh ↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.stateText}>Loading your records...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Couldn't load history</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : prescriptions.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.emptyIcon}>▤</Text>
          <Text style={styles.stateTitle}>No prescriptions yet</Text>
          <Text style={styles.stateText}>
            Your scanned prescriptions will appear here after you upload them.
          </Text>
        </View>
      ) : (
        prescriptions.map((prescription) => (
          <View key={prescription.id} style={styles.prescriptionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.documentIcon}>
                <Text style={styles.documentIconText}>▤</Text>
              </View>

              <View style={styles.cardHeading}>
                <Text style={styles.cardTitle}>
                  Prescription #{prescription.id}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(prescription.created_at)}
                </Text>
              </View>

              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>Saved</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.medicationCount}>
              {prescription.medications?.length || 0} medication entries
            </Text>

            {(prescription.medications || []).slice(0, 4).map((medication, index) => (
              <View key={index} style={styles.medicationRow}>
                <View style={styles.bullet} />
                <Text style={styles.medicationName}>
                  {medication.name || 'Unknown medication'}
                </Text>
                <Text style={styles.dosage}>
                  {medication.dosage || '—'}
                </Text>
              </View>
            ))}

            {(prescription.medications?.length || 0) > 4 && (
              <Text style={styles.moreText}>
                +{prescription.medications.length - 4} more medications
              </Text>
            )}

            {prescription.doctor_notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>DOCTOR'S NOTES</Text>
                <Text style={styles.notesText}>
                  {prescription.doctor_notes}
                </Text>
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>Your health records matter</Text>
        <Text style={styles.disclaimerText}>
          Extracted prescription details may contain errors. Keep your original
          prescription and verify medication instructions with your clinician.
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
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 12,
  },
  description: {
    color: '#64788B',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  summaryNumber: {
    color: '#102A43',
    fontSize: 27,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#8293A5',
    fontSize: 11,
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#102A43',
    fontSize: 18,
    fontWeight: '800',
  },
  refreshText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 34,
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
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#E6F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentIconText: {
    color: '#0F766E',
    fontSize: 22,
  },
  cardHeading: {
    flex: 1,
  },
  cardTitle: {
    color: '#102A43',
    fontSize: 14,
    fontWeight: '800',
  },
  cardDate: {
    color: '#8293A5',
    fontSize: 11,
    marginTop: 4,
  },
  savedBadge: {
    backgroundColor: '#E8F6EF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  savedBadgeText: {
    color: '#24734E',
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F5',
    marginVertical: 15,
  },
  medicationCount: {
    color: '#8293A5',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 10,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0D9488',
    marginRight: 9,
  },
  medicationName: {
    color: '#52677A',
    fontSize: 12,
    flex: 1,
  },
  dosage: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
  },
  moreText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  notesCard: {
    backgroundColor: '#F3F7FA',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  notesLabel: {
    color: '#8293A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  notesText: {
    color: '#52677A',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  disclaimerCard: {
    backgroundColor: '#EDF6F5',
    borderRadius: 14,
    padding: 17,
    marginTop: 13,
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
