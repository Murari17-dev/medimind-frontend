import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { MedicationCard } from '@/components/medication-card';
import { Disclaimer, PageHeader, Screen, SectionHeader, StateCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { usePrescriptions } from '@/hooks/use-api-data';

export default function MedicationsScreen() {
  const { data, error, isLoading, isValidating, mutate } = usePrescriptions();
  const [query, setQuery] = useState('');

  const prescriptions = data ?? [];

  const medications = useMemo(
    () =>
      (data ?? []).flatMap((prescription) =>
        prescription.medications.map((medication) => ({
          medication,
          prescriptionId: prescription.id,
        })),
      ),
    [data],
  );

  const normalisedQuery = query.trim().toLowerCase();
  const visible = normalisedQuery
    ? medications.filter(({ medication }) =>
        `${medication.name} ${medication.dosage}`.toLowerCase().includes(normalisedQuery),
      )
    : medications;

  return (
    <Screen onRefresh={() => void mutate()} refreshing={isValidating && !isLoading}>
      <PageHeader
        eyebrow="MEDICATION LIBRARY"
        title="Your medications."
        description="A consolidated view of medicines extracted from your saved prescriptions."
      />

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>SAVED MEDICATION ENTRIES</Text>
          <Text style={styles.summaryNumber}>{isLoading ? '—' : medications.length}</Text>
          <Text style={styles.summaryCaption}>Across {prescriptions.length} prescriptions</Text>
        </View>
      </View>

      <SectionHeader
        title="All medications"
        subtitle="Extracted from your prescription history"
        actionLabel="Refresh"
        onAction={() => void mutate()}
      />

      {medications.length > 0 ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or dosage"
          placeholderTextColor={Colors.subtle}
          accessibilityLabel="Search medications"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.search}
        />
      ) : null}

      {isLoading ? (
        <StateCard loading message="Loading medication records..." />
      ) : error ? (
        <StateCard
          title="Unable to load records"
          message={error.message}
          actionLabel="Try again"
          onAction={() => void mutate()}
        />
      ) : medications.length === 0 ? (
        <StateCard
          title="No medications yet"
          message="Upload a prescription using the Scan tab to see extracted medications here."
        />
      ) : visible.length === 0 ? (
        <StateCard title="No matches" message={`Nothing matches "${query.trim()}".`} />
      ) : (
        visible.map(({ medication, prescriptionId }, index) => (
          <MedicationCard
            key={`${prescriptionId}-${index}`}
            medication={medication}
            footer={`Prescription #${prescriptionId}`}
          />
        ))
      )}

      <Disclaimer title="A quick reminder">
        These records are extracted from prescription images. They are not confirmation that a
        medicine is currently prescribed or should be taken. Always follow your clinician&apos;s
        instructions.
      </Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: Colors.dark,
    borderRadius: 20,
    padding: 22,
  },
  summaryLabel: {
    color: '#A7E8DE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  summaryNumber: { color: Colors.surface, fontSize: 44, fontWeight: '800', marginTop: 6 },
  summaryCaption: { color: Colors.darkText, fontSize: 12, marginTop: 2 },
  search: {
    height: 46,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 11,
    paddingHorizontal: 14,
    marginBottom: 14,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
});
