
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
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
  times_of_day: string[] | string;
  verification_note?: string;
}

interface Prescription {
  id?: number;
  doctor_notes?: string;
  medications: Medication[];
}

export default function ScanScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] =
    useState<Prescription | null>(null);

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const uploadImage = async (
    asset: ImagePicker.ImagePickerAsset
  ) => {
    setLoading(true);
    setPrescription(null);

    try {
      const formData = new FormData();

      let response: Response;

      if (Platform.OS === 'web') {
        if (!asset.file) {
          throw new Error('Could not access the selected image file.');
        }

        formData.append('file', asset.file);

        response = await fetch(
          `${API_BASE_URL}/api/v1/parse-prescription`,
          {
            method: 'POST',
            body: formData,
          }
        );
      } else {
        // Temporary Android upload diagnostics.
        const imageFile = new File(asset.uri);

        formData.append('file', imageFile);

        const entries = Array.from(formData.entries());
        const entry = entries[0]?.[1] as any;

        const blobAvailable = typeof Blob !== 'undefined';

        Alert.alert(
          'MediMind Upload Diagnostics',
          JSON.stringify(
            {
              fileInstance: imageFile instanceof File,
              blobAvailable,
              blobInstance: blobAvailable
                ? imageFile instanceof Blob
                : 'Blob unavailable',
              hasBytesMethod:
                typeof (imageFile as any).bytes === 'function',
              uri: imageFile.uri,
              formDataInstance: formData instanceof FormData,
              entryIsBlob:
                blobAvailable && entry
                  ? entry instanceof Blob
                  : 'Cannot check',
              entryHasBytes:
                typeof entry?.bytes === 'function',
              entryType: typeof entry,
              entryIsArray: Array.isArray(entry),
            },
            null,
            2
          )
        );

        // Diagnostic only: deliberately stop before uploading.
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Prescription processing failed.'
        );
      }

      setPrescription(data);
    } catch (error: any) {
      showError(
        'Prescription processing failed',
        error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const chooseImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          showError(
            'Camera permission',
            'Please allow camera access to take a photo.'
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.85,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        setImage(asset.uri);
        await uploadImage(asset);
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showError(
            'Photo library permission',
            'Please allow access to your photos.'
          );
          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.85,
          });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        setImage(asset.uri);
        await uploadImage(asset);
      }
    } catch (error: any) {
      showError(
        'Image selection failed',
        error?.message || 'Could not select the image.'
      );
    }
  };

  const getTimes = (times: string[] | string) => {
    if (Array.isArray(times)) {
      return times.join(' · ');
    }

    return times || '';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>SMART PRESCRIPTION READER</Text>

      <Text style={styles.title}>Scan a prescription.</Text>

      <Text style={styles.description}>
        Take a clear photo or upload an existing image. MediMind
        will extract the medication details for you.
      </Text>

      <View style={styles.uploadCard}>
        <View style={styles.uploadIcon}>
          <Text style={styles.uploadIconText}>↑</Text>
        </View>

        <Text style={styles.uploadTitle}>
          Upload your prescription
        </Text>

        <Text style={styles.uploadDescription}>
          Place your prescription on a flat surface and make sure
          all text is visible.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => chooseImage(false)}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            Choose from gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => chooseImage(true)}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            Take a photo
          </Text>
        </TouchableOpacity>

        <Text style={styles.fileInfo}>
          JPG · PNG · WEBP · Maximum 10 MB
        </Text>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>
          Tips for a better scan
        </Text>

        {[
          'Use good lighting and avoid shadows.',
          'Keep the camera parallel to the prescription.',
          'Make sure medication names and dosages are readable.',
          'Include the entire prescription in the image.',
        ].map((tip, index) => (
          <View style={styles.tipRow} key={index}>
            <Text style={styles.tipNumber}>{index + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {image && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>
            Selected prescription
          </Text>

          <Image
            source={{ uri: image }}
            style={styles.previewImage}
          />
        </View>
      )}

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0D9488" />

          <Text style={styles.loadingTitle}>
            Analysing prescription...
          </Text>

          <Text style={styles.loadingDescription}>
            Please wait while the AI extracts medication details.
          </Text>
        </View>
      )}

      {prescription && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>
            Extracted medications
          </Text>

          {prescription.doctor_notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>
                Doctor's notes
              </Text>

              <Text style={styles.notesText}>
                {prescription.doctor_notes}
              </Text>
            </View>
          ) : null}

          {prescription.medications?.map((med, index) => (
            <View style={styles.medCard} key={index}>
              <Text style={styles.medName}>{med.name}</Text>

              <Text style={styles.medDosage}>
                {med.dosage}
              </Text>

              <Text style={styles.medInstructions}>
                {med.instructions}
              </Text>

              {getTimes(med.times_of_day) ? (
                <Text style={styles.medTime}>
                  {getTimes(med.times_of_day)}
                </Text>
              ) : null}

              {med.verification_note ? (
                <Text style={styles.warning}>
                  {med.verification_note}
                </Text>
              ) : null}
            </View>
          ))}

          <Text style={styles.disclaimer}>
            Always verify extracted medication information with
            your original prescription and a qualified healthcare
            professional.
          </Text>
        </View>
      )}
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
    marginBottom: 27,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EEF2',
  },
  uploadIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E6F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  uploadIconText: {
    color: '#0F766E',
    fontSize: 32,
    fontWeight: '500',
  },
  uploadTitle: {
    color: '#102A43',
    fontSize: 19,
    fontWeight: '800',
  },
  uploadDescription: {
    color: '#8293A5',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 22,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0F766E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C9DAD9',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 11,
  },
  secondaryButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '700',
  },
  fileInfo: {
    color: '#9AA8B5',
    fontSize: 10,
    marginTop: 16,
  },
  tipsCard: {
    backgroundColor: '#EDF6F5',
    borderRadius: 17,
    padding: 20,
    marginTop: 22,
  },
  tipsTitle: {
    color: '#164E50',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 15,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipNumber: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: '#D2EAE5',
    color: '#0F766E',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 11,
    overflow: 'hidden',
  },
  tipText: {
    color: '#526D72',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  resultSection: {
    marginTop: 28,
  },
  sectionTitle: {
    color: '#102A43',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 14,
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 25,
    alignItems: 'center',
    marginTop: 22,
  },
  loadingTitle: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 14,
  },
  loadingDescription: {
    color: '#8293A5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  notesCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
  },
  notesTitle: {
    color: '#9A6B15',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  notesText: {
    color: '#76551B',
    fontSize: 13,
    lineHeight: 20,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 17,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  medName: {
    color: '#102A43',
    fontSize: 16,
    fontWeight: '800',
  },
  medDosage: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  medInstructions: {
    color: '#64788B',
    fontSize: 13,
    marginTop: 10,
    lineHeight: 20,
  },
  medTime: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
  },
  warning: {
    color: '#A65320',
    backgroundColor: '#FFF3E9',
    padding: 10,
    borderRadius: 8,
    fontSize: 11,
    marginTop: 10,
  },
  disclaimer: {
    color: '#8293A5',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 12,
  },
});
