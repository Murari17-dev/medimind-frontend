
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function ProfileScreen() {
  const settings = [
    {
      icon: '♙',
      title: 'Personal information',
      subtitle: 'Manage your profile details',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Manage medication reminders',
    },
    {
      icon: '🔒',
      title: 'Privacy and security',
      subtitle: 'Learn how your data is handled',
    },
    {
      icon: '❔',
      title: 'Help and support',
      subtitle: 'Get assistance with MediMind',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>ACCOUNT</Text>
      <Text style={styles.title}>Your profile.</Text>
      <Text style={styles.description}>
        Manage your account and MediMind preferences.
      </Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>MediMind User</Text>
          <Text style={styles.profileEmail}>
            Personal health workspace
          </Text>
        </View>

        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>

      <View style={styles.settingsCard}>
        {settings.map((item, index) => (
          <React.Fragment key={item.title}>
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() =>
                showMessage(
                  item.title,
                  'This feature will be available in a future MediMind update.'
                )
              }
            >
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>{item.icon}</Text>
              </View>

              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {index !== settings.length - 1 && (
              <View style={styles.divider} />
            )}
          </React.Fragment>
        ))}
      </View>

      <Text style={styles.sectionTitle}>About MediMind</Text>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutName}>MediMind</Text>
        <Text style={styles.aboutDescription}>
          AI-assisted prescription reading and medication organisation.
        </Text>

        <View style={styles.aboutDivider} />

        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>App version</Text>
          <Text style={styles.versionValue}>1.0.0</Text>
        </View>

        <View style={styles.versionRow}>
          <Text style={styles.versionLabel}>AI extraction</Text>
          <Text style={styles.versionValue}>GPT-6 Luna</Text>
        </View>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Medical information notice</Text>
        <Text style={styles.noticeText}>
          MediMind helps organise information extracted from prescription
          images. It does not diagnose conditions, prescribe medicines, or
          replace professional medical advice. Always verify extracted
          information with your healthcare professional.
        </Text>
      </View>

      <Text style={styles.footer}>Made with care · MediMind</Text>
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF0F4',
    marginBottom: 30,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#DDF3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#0F766E',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#102A43',
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#8293A5',
    fontSize: 11,
    marginTop: 5,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F6EF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#269568',
    marginRight: 5,
  },
  activeText: {
    color: '#24734E',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingHorizontal: 16,
    marginBottom: 29,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#EDF6F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 17,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: '#263F53',
    fontSize: 13,
    fontWeight: '700',
  },
  settingSubtitle: {
    color: '#8293A5',
    fontSize: 10,
    marginTop: 4,
  },
  chevron: {
    color: '#9AA8B5',
    fontSize: 23,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F5',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 19,
    borderWidth: 1,
    borderColor: '#EAF0F4',
    marginBottom: 20,
  },
  aboutName: {
    color: '#102A43',
    fontSize: 17,
    fontWeight: '800',
  },
  aboutDescription: {
    color: '#8293A5',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#EEF2F5',
    marginVertical: 15,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  versionLabel: {
    color: '#8293A5',
    fontSize: 11,
  },
  versionValue: {
    color: '#52677A',
    fontSize: 11,
    fontWeight: '700',
  },
  noticeCard: {
    backgroundColor: '#FFF7E9',
    borderRadius: 14,
    padding: 17,
  },
  noticeTitle: {
    color: '#8C5A16',
    fontSize: 13,
    fontWeight: '800',
  },
  noticeText: {
    color: '#896D46',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },
  footer: {
    color: '#A0ACB7',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 28,
  },
});
