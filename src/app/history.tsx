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
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/prescriptions');

      if (!response.ok) {
        let message = 'Unable to load prescription history.';
        try {
          const body = await response.json();
          message = body.detail || message;
        } catch {
          // Keep the default message if the response is not JSON.
        }
        throw new Error(message);
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

  const deletePrescription = async (prescriptionId: number) => {
    if (deletingId !== null || clearingAll) return;

    setDeletingId(prescriptionId);
    setError('');

    try {
      const response = await apiFetch(
        `/api/v1/prescriptions/${prescriptionId}`,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        let message = 'Unable to delete this prescription.';
        try {
          const body = await response.json();
          message = body.detail || message;
        } catch {
          // Keep the default message if the response is not JSON.
        }
        throw new Error(message);
      }

      setPrescriptions((current) =>
        current.filter((item) => item.id !== prescriptionId),
      );
      setPendingDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Could not delete this prescription.');
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllPrescriptions = async () => {
    if (clearingAll || deletingId !== null) return;

    setClearingAll(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/prescriptions', {
        method: 'DELETE',
      });

      if (!response.ok) {
        let message = 'Unable to clear prescription history.';
        try {
          const body = await response.json();
          message = body.detail || message;
        } catch {
          // Keep the default message if the response is not JSON.
        }
        throw new Error(message);
      }

      setPrescriptions([]);
      setConfirmClearAll(false);
      setPendingDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Could not clear prescription history.');
    } finally {
      setClearingAll(false);
    }
  };

  const medicationCount = prescriptions.reduce(
    (total, item) => total + (item.medications?.length || 0),
    0,
  );

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
            {loading ? '—' : medicationCount}
          </Text>
          <Text style={styles.summaryLabel}>Medication entries</Text>
        </View>
      </View>

      {!loading && !error && prescriptions.length > 0 && (
        <View style={styles.clearAllContainer}>
          {confirmClearAll ? (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Delete all prescriptions?</Text>
              <Text style={styles.confirmDescription}>
                This permanently deletes all prescriptions in your account and
                their associated medication records. Your separately configured
                medication reminders will be kept.
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setConfirmClearAll(false)}
                  disabled={clearingAll}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={deleteAllPrescriptions}
                  disabled={clearingAll}
                >
                  {clearingAll ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmDeleteText}>Delete all</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                setPendingDeleteId(null);
                setConfirmClearAll(true);
              }}
              disabled={deletingId !== null || clearingAll}
            >
              <Text style={styles.clearAllText}>Clear all history</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <TouchableOpacity onPress={loadHistory} disabled={loading || clearingAll || deletingId !== null}>
          <Text style={styles.refreshText}>Refresh ↻</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.stateText}>Loading your records...</Text>
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

            {pendingDeleteId === prescription.id ? (
              <View style={styles.inlineConfirm}>
                <Text style={styles.confirmTitle}>Delete this prescription?</Text>
                <Text style={styles.confirmDescription}>
                  Its associated medication entries will also be deleted.
                  Any linked reminders will be preserved.
                </Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setPendingDeleteId(null)}
                    disabled={deletingId !== null}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDeleteButton}
                    onPress={() => deletePrescription(prescription.id)}
                    disabled={deletingId !== null}
                  >
                    {deletingId === prescription.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmDeleteText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setConfirmClearAll(false);
                  setPendingDeleteId(prescription.id);
                }}
                disabled={deletingId !== null || clearingAll}
              >
                <Text style={styles.deleteButtonText}>Delete prescription</Text>
              </TouchableOpacity>
            )}
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
    marginBottom: 20,
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
  clearAllContainer: {
    marginBottom: 25,
  },
  clearAllButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#F0C9C9',
    backgroundColor: '#FFF7F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearAllText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '800',
  },
  confirmCard: {
    backgroundColor: '#FFF7F7',
    borderColor: '#F0C9C9',
    borderWidth: 1,
    borderRadius: 13,
    padding: 16,
  },
  inlineConfirm: {
    marginTop: 16,
    backgroundColor: '#FFF7F7',
    borderColor: '#F0C9C9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
  },
  confirmTitle: {
    color: '#102A43',
    fontSize: 13,
    fontWeight: '800',
  },
  confirmDescription: {
    color: '#64788B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 13,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#D8E1E8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
    minWidth: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#52677A',
    fontSize: 11,
    fontWeight: '800',
  },
  confirmDeleteButton: {
    backgroundColor: '#B42318',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
  errorCard: {
    backgroundColor: '#FFF7F7',
    borderColor: '#F0C9C9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
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
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F0C9C9',
    backgroundColor: '#FFF7F7',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
  },
  deleteButtonText: {
    color: '#B42318',
    fontSize: 11,
    fontWeight: '800',
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
