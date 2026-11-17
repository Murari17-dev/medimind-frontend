import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Disclaimer, PageHeader, Screen, SectionHeader } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useUserEmail } from '@/hooks/use-user';
import { notify } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const email = useUserEmail();
  const [signingOut, setSigningOut] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) notify('Sign out failed', error.message);
  };

  return (
    <Screen>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Your profile."
        description="Manage your account and MediMind preferences."
      />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(email?.[0] ?? 'M').toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.profileLabel}>Signed in as</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {email ?? 'Your account'}
          </Text>
        </View>
      </View>

      <Button label="Sign out" variant="danger" onPress={() => void signOut()} loading={signingOut} />

      <SectionHeader title="About MediMind" />

      <View style={styles.aboutCard}>
        <Text style={styles.aboutDescription}>
          AI-assisted prescription reading and medication organisation.
        </Text>
        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>App version</Text>
          <Text style={styles.versionValue}>{version}</Text>
        </View>
      </View>

      <Disclaimer title="Medical information notice">
        MediMind helps organise information extracted from prescription images. It does not
        diagnose conditions, prescribe medicines, or replace professional medical advice. Always
        verify extracted information with your healthcare professional.
      </Disclaimer>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.surface, fontSize: 22, fontWeight: '800' },
  profileLabel: { color: Colors.subtle, fontSize: 12 },
  profileEmail: { color: Colors.ink, fontSize: 16, fontWeight: '800', marginTop: 2 },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  aboutDescription: { color: Colors.muted, fontSize: 13, lineHeight: 20 },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF3F6',
  },
  versionLabel: { color: Colors.subtle, fontSize: 13 },
  versionValue: { color: Colors.ink, fontSize: 13, fontWeight: '700' },
});
