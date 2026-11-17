import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { MedicationCard } from '@/components/medication-card';
import { Button, Disclaimer, PageHeader, Screen, SectionHeader, StateCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { refreshPrescriptions } from '@/hooks/use-api-data';
import { apiJson } from '@/lib/api';
import { notify } from '@/lib/feedback';
import type { Prescription } from '@/lib/types';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TIPS = [
  'Use good lighting and avoid shadows.',
  'Keep the camera parallel to the prescription.',
  'Make sure medication names and dosages are readable.',
  'Include the entire prescription in the image.',
];

function normaliseMimeType(asset: ImagePicker.ImagePickerAsset) {
  const type = (asset.mimeType || 'image/jpeg').toLowerCase();
  return type === 'image/jpg' ? 'image/jpeg' : type;
}

function buildFormData(asset: ImagePicker.ImagePickerAsset, mimeType: string) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    if (!asset.file) {
      throw new Error('Could not access the selected image file.');
    }
    formData.append('file', asset.file);
  } else {
    // React Native streams a file from its uri when given this descriptor.
    formData.append('file', {
      uri: asset.uri,
      type: mimeType,
      name: asset.fileName || `prescription.${EXTENSIONS[mimeType]}`,
    } as unknown as Blob);
  }

  return formData;
}

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  const upload = async (asset: ImagePicker.ImagePickerAsset) => {
    const mimeType = normaliseMimeType(asset);

    if (!ALLOWED_TYPES.includes(mimeType)) {
      notify('Unsupported image', 'Please choose a JPG, PNG or WEBP image.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
      notify('Image too large', 'Please choose an image smaller than 10 MB.');
      return;
    }

    setImageUri(asset.uri);
    setPrescription(null);
    setLoading(true);

    try {
      const result = await apiJson<Prescription>(
        '/api/v1/parse-prescription',
        { method: 'POST', body: buildFormData(asset, mimeType), timeoutMs: 150_000 },
        'Prescription processing failed.',
      );

      setPrescription(result);
      void refreshPrescriptions();
    } catch (error: any) {
      notify('Prescription processing failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chooseImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        notify(
          useCamera ? 'Camera permission' : 'Photo library permission',
          useCamera
            ? 'Please allow camera access to take a photo.'
            : 'Please allow access to your photos.',
        );
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets?.length) return;

      await upload(result.assets[0]);
    } catch (error: any) {
      notify('Image selection failed', error?.message || 'Could not select the image.');
    }
  };

  return (
    <Screen>
      <PageHeader
        eyebrow="SMART PRESCRIPTION READER"
        title="Scan a prescription."
        description="Take a clear photo or upload an existing image. MediMind will extract the medication details for you to review."
      />

      <View style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>Upload your prescription</Text>
        <Text style={styles.uploadDescription}>
          Place your prescription on a flat surface and make sure all text is visible.
        </Text>

        <View style={styles.buttons}>
          <Button
            label="Choose from gallery"
            onPress={() => void chooseImage(false)}
            disabled={loading}
          />
          {Platform.OS !== 'web' ? (
            <Button
              label="Take a photo"
              variant="secondary"
              onPress={() => void chooseImage(true)}
              disabled={loading}
            />
          ) : null}
        </View>

        <Text style={styles.fileInfo}>JPG · PNG · WEBP · Maximum 10 MB</Text>
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Tips for a better scan</Text>
        {TIPS.map((tip, index) => (
          <View style={styles.tipRow} key={tip}>
            <Text style={styles.tipNumber}>{index + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {imageUri ? (
        <>
          <SectionHeader title="Selected prescription" />
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            accessibilityLabel="The prescription image you selected"
          />
        </>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <StateCard
            loading
            title="Analysing prescription..."
            message="This can take up to a minute while the AI reads your prescription."
          />
        </View>
      ) : null}

      {prescription ? (
        <>
          <SectionHeader
            title="Extracted medications"
            subtitle={`Saved as prescription #${prescription.id}`}
          />

          {prescription.doctor_notes ? (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Doctor&apos;s notes</Text>
              <Text style={styles.notesText}>{prescription.doctor_notes}</Text>
            </View>
          ) : null}

          {prescription.medications.length === 0 ? (
            <StateCard
              title="No medications found"
              message="We could not find any medications in this image. Try a clearer photo of the full prescription."
            />
          ) : (
            prescription.medications.map((medication, index) => (
              <MedicationCard key={`${medication.name}-${index}`} medication={medication} />
            ))
          )}

          {prescription.medications.length > 0 ? (
            <Button
              label="Set up reminders"
              variant="secondary"
              onPress={() => router.push('/reminders')}
            />
          ) : null}
        </>
      ) : null}

      <Disclaimer>
        Always verify extracted medication information with your original prescription and a
        qualified healthcare professional.
      </Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
    backgroundColor: Colors.surface,
    borderRadius: 21,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadTitle: { color: Colors.ink, fontSize: 19, fontWeight: '800' },
  uploadDescription: {
    color: Colors.subtle,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  buttons: { gap: 11 },
  fileInfo: { color: '#9AA8B5', fontSize: 11, marginTop: 16, textAlign: 'center' },
  tips: { backgroundColor: '#EDF6F5', borderRadius: 17, padding: 20, marginTop: 22 },
  tipsTitle: { color: '#164E50', fontSize: 15, fontWeight: '800', marginBottom: 15 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 11 },
  tipNumber: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: '#D2EAE5',
    color: Colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 23,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  tipText: { color: '#526D72', fontSize: 12, flex: 1, lineHeight: 18 },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    resizeMode: 'contain',
    backgroundColor: Colors.surface,
  },
  loading: { marginTop: 22 },
  notes: {
    backgroundColor: Colors.noticeTint,
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
  },
  notesTitle: { color: '#9A6B15', fontSize: 12, fontWeight: '800', marginBottom: 5 },
  notesText: { color: Colors.notice, fontSize: 13, lineHeight: 20 },
});
