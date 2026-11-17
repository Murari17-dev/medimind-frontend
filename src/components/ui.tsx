import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth } from '@/constants/colors';

export function Screen({
  children,
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flex}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}) {
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.button, buttonVariants[variant], inactive && styles.buttonDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.surface : Colors.primary} />
      ) : (
        <Text style={[styles.buttonText, buttonTextVariants[variant]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function StateCard({
  loading = false,
  title,
  message,
  actionLabel,
  onAction,
}: {
  loading?: boolean;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.stateCard} accessibilityLiveRegion="polite">
      {loading ? <ActivityIndicator size="large" color={Colors.accent} /> : null}
      {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={styles.stateAction}
          accessibilityRole="button"
        >
          <Text style={styles.stateActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Disclaimer({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.disclaimer}>
      {title ? <Text style={styles.disclaimerTitle}>{title}</Text> : null}
      <Text style={styles.disclaimerText}>{children}</Text>
    </View>
  );
}

const buttonVariants = StyleSheet.create({
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#C9DAD9' },
  danger: { backgroundColor: Colors.dangerTint },
});

const buttonTextVariants = StyleSheet.create({
  primary: { color: Colors.surface },
  secondary: { color: Colors.primary },
  danger: { color: Colors.danger },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 56,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { marginBottom: 24 },
  eyebrow: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: Colors.ink,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 8,
  },
  description: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: { color: Colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  sectionSubtitle: { color: Colors.subtle, fontSize: 12, marginTop: 3 },
  sectionAction: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontSize: 14, fontWeight: '800' },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 26,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: { color: Colors.ink, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stateText: { color: Colors.subtle, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  stateAction: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.tint,
  },
  stateActionText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  disclaimer: {
    backgroundColor: '#EDF6F5',
    borderRadius: 16,
    padding: 18,
    marginTop: 28,
  },
  disclaimerTitle: { color: '#164E50', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  disclaimerText: { color: '#526D72', fontSize: 12, lineHeight: 19 },
});
