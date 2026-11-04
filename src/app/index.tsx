
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'https://medimind-backend-8mbb.onrender.com';

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

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [history, setHistory] = useState<Prescription[]>([]);
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/prescriptions`);
      const data = await response.json();

      if (response.ok) {
        setHistory(data);
      }
    } catch (error) {
      console.error('History loading failed:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const uploadAndParse = async (file: any) => {
    setLoading(true);
    setPrescription(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/parse-prescription`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPrescription(data);
        await fetchHistory();
      } else {
        showError('Unable to process prescription', data.detail || 'Please try again.');
      }
    } catch (error: any) {
      showError(
        'Connection problem',
        error.message || 'Could not connect to the MediMind server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showError('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setImage(asset.uri);
    setActiveTab('scanner');

    if (Platform.OS === 'web' && asset.file) {
      await uploadAndParse(asset.file);
    } else {
      const formDataFile = {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'prescription.jpg',
      };
      await uploadAndParse(formDataFile);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <View>
              <Text style={styles.brandName}>MediMind</Text>
              <Text style={styles.brandSubtitle}>YOUR HEALTH COMPANION</Text>
            </View>
          </View>

          <View style={styles.headerBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerBadgeText}>AI READY</Text>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>YOUR PERSONAL HEALTH SPACE</Text>
          <Text style={styles.welcomeTitle}>Healthcare,{"\n"}made simpler.</Text>
          <Text style={styles.welcomeDescription}>
            Understand prescriptions and keep your medications organised in one place.
          </Text>
        </View>

        {/* Main Scan Card */}
        <View style={styles.scanCard}>
          <View style={styles.scanCardTop}>
            <View style={styles.scanIcon}>
              <Text style={styles.scanIconText}>✦</Text>
            </View>
            <View style={styles.scanLabel}>
              <Text style={styles.scanLabelTitle}>AI PRESCRIPTION SCANNER</Text>
              <Text style={styles.scanLabelSubtitle}>Powered by intelligent extraction</Text>
            </View>
          </View>

          <Text style={styles.scanTitle}>Have a prescription?</Text>
          <Text style={styles.scanDescription}>
            Upload a photo and let MediMind extract medication details for you.
          </Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={pickImage}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.scanButtonText}>
              {loading ? 'Processing...' : '＋  Upload prescription'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.scanFootnote}>
            JPG, PNG or WEBP · Maximum 10 MB
          </Text>
        </View>

        {/* Processing */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0D9488" />
            <View>
              <Text style={styles.loadingTitle}>Reading your prescription</Text>
              <Text style={styles.loadingSubtitle}>
                AI is analysing the uploaded image...
              </Text>
            </View>
          </View>
        )}

        {/* Image Preview */}
        {image && (
          <View style={styles.previewCard}>
            <Text style={styles.sectionTitle}>Uploaded image</Text>
            <Image source={{ uri: image }} style={styles.previewImage} />
          </View>
        )}

        {/* Extraction Results */}
        {prescription && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>EXTRACTION COMPLETE</Text>
                <Text style={styles.sectionTitle}>Prescription results</Text>
              </View>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>PROCESSED</Text>
              </View>
            </View>

            {prescription.doctor_notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>DOCTOR'S NOTES</Text>
                <Text style={styles.notesText}>{prescription.doctor_notes}</Text>
              </View>
            ) : null}

            {prescription.medications.map((med, index) => (
              <View key={index} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationNumber}>
                    <Text style={styles.medicationNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDosage}>{med.dosage}</Text>
                  </View>
                </View>

                <Text style={styles.medicationInstructions}>
                  {med.instructions}
                </Text>

                {med.times_of_day?.length > 0 && (
                  <View style={styles.timeContainer}>
                    {med.times_of_day.map((time, idx) => (
                      <View key={idx} style={styles.timeBadge}>
                        <Text style={styles.timeBadgeText}>{time}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {med.verification_note ? (
                  <View style={styles.warningCard}>
                    <Text style={styles.warningText}>
                      {med.verification_note}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}

            <Text style={styles.disclaimer}>
              AI-extracted information may contain errors. Always verify medication names,
              dosages and instructions with your prescription and pharmacist or doctor.
            </Text>
          </View>
        )}

        {/* Section Navigation */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>YOUR RECORDS</Text>
            <Text style={styles.sectionTitle}>Prescription activity</Text>
          </View>
        </View>

        <View style={styles.localTabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('scanner')}
            style={[styles.localTab, activeTab === 'scanner' && styles.localTabActive]}
          >
            <Text style={[styles.localTabText, activeTab === 'scanner' && styles.localTabTextActive]}>
              New scan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            style={[styles.localTab, activeTab === 'history' && styles.localTabActive]}
          >
            <Text style={[styles.localTabText, activeTab === 'history' && styles.localTabTextActive]}>
              History ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'scanner' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>▧</Text>
            <Text style={styles.emptyTitle}>Ready for your next scan</Text>
            <Text style={styles.emptyDescription}>
              Your newly processed prescriptions will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.historySection}>
            {history.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>▤</Text>
                <Text style={styles.emptyTitle}>No prescriptions yet</Text>
                <Text style={styles.emptyDescription}>
                  Your saved prescription records will appear here.
                </Text>
              </View>
            ) : (
              history.map((item, index) => (
                <View key={item.id ?? index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>
                      Prescription #{item.id}
                    </Text>
                    <Text style={styles.historyCount}>
                      {item.medications?.length || 0} medications
                    </Text>
                  </View>

                  {item.doctor_notes ? (
                    <Text style={styles.historyNotes}>{item.doctor_notes}</Text>
                  ) : null}

                  {item.medications?.map((med, idx) => (
                    <Text key={idx} style={styles.historyMedication}>
                      • {med.name} · {med.dosage}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>MediMind</Text>
          <Text style={styles.footerText}>
            Helping you understand your prescriptions.
          </Text>
          <Text style={styles.footerDisclaimer}>
            Not a substitute for professional medical advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 50,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 38,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },
  brandName: {
    color: '#102A43',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  brandSubtitle: {
    color: '#8293A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F5F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 7,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#0D9488',
  },
  headerBadgeText: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  welcome: {
    marginBottom: 28,
  },
  eyebrow: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 13,
  },
  welcomeTitle: {
    color: '#102A43',
    fontSize: 43,
    lineHeight: 49,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  welcomeDescription: {
    color: '#64788B',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 490,
  },
  scanCard: {
    backgroundColor: '#123B49',
    borderRadius: 23,
    padding: 25,
    marginBottom: 30,
  },
  scanCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 27,
  },
  scanIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#245966',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scanIconText: {
    color: '#83E0D2',
    fontSize: 24,
    fontWeight: '800',
  },
  scanLabel: {
    flex: 1,
  },
  scanLabelTitle: {
    color: '#A7E8DE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scanLabelSubtitle: {
    color: '#B4C8CD',
    fontSize: 11,
    marginTop: 4,
  },
  scanTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  scanDescription: {
    color: '#C3D4D8',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    marginBottom: 22,
    maxWidth: 500,
  },
  scanButton: {
    backgroundColor: '#72D8C8',
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#103B43',
    fontSize: 15,
    fontWeight: '800',
  },
  scanFootnote: {
    color: '#AFC6CA',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 17,
  },
  loadingTitle: {
    color: '#102A43',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingSubtitle: {
    color: '#8293A5',
    fontSize: 12,
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 17,
    marginBottom: 25,
  },
  previewImage: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F8',
  },
  resultsSection: {
    marginBottom: 30,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  sectionEyebrow: {
    color: '#0D9488',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#102A43',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  successBadge: {
    backgroundColor: '#E6F5F1',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  successBadgeText: {
    color: '#0F766E',
    fontSize: 9,
    fontWeight: '800',
  },
  notesCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 13,
    padding: 15,
    marginBottom: 13,
  },
  notesLabel: {
    color: '#9A6B15',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    color: '#76551B',
    fontSize: 13,
    lineHeight: 20,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },
  medicationNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#E6F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicationNumberText: {
    color: '#0F766E',
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
    color: '#71869A',
    fontSize: 12,
    marginTop: 3,
  },
  medicationInstructions: {
    color: '#52677A',
    fontSize: 13,
    lineHeight: 20,
  },
  timeContainer: {
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
  timeBadgeText: {
    color: '#187B78',
    fontSize: 11,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#FFF3E9',
    padding: 11,
    borderRadius: 9,
    marginTop: 12,
  },
  warningText: {
    color: '#A65320',
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimer: {
    color: '#8A98A7',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 9,
  },
  localTabs: {
    flexDirection: 'row',
    backgroundColor: '#EAF0F4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  localTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 9,
  },
  localTabActive: {
    backgroundColor: '#FFFFFF',
  },
  localTabText: {
    color: '#71869A',
    fontSize: 13,
    fontWeight: '700',
  },
  localTabTextActive: {
    color: '#0F766E',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  emptyIcon: {
    color: '#0D9488',
    fontSize: 31,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyDescription: {
    color: '#8293A5',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
  historySection: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 17,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    color: '#102A43',
    fontSize: 14,
    fontWeight: '800',
  },
  historyCount: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
  },
  historyNotes: {
    color: '#71869A',
    fontSize: 12,
    marginBottom: 8,
  },
  historyMedication: {
    color: '#52677A',
    fontSize: 12,
    lineHeight: 21,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 35,
    paddingBottom: 10,
  },
  footerBrand: {
    color: '#0F766E',
    fontSize: 16,
    fontWeight: '800',
  },
  footerText: {
    color: '#8293A5',
    fontSize: 11,
    marginTop: 5,
  },
  footerDisclaimer: {
    color: '#A0ACB7',
    fontSize: 10,
    marginTop: 12,
  },
});
