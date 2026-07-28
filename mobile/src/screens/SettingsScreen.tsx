import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { getApiBaseUrl, getShopName, logOut, setApiBaseUrl } from '../storage/settings';
import { getCurrentVolume, listVolumes, startVolume, testConnection } from '../api/client';
import type { Volume } from '../types/receipt';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default function SettingsScreen({ navigation }: Props) {
  const [shopName, setShopNameDisplay] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [savingConnection, setSavingConnection] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [currentVolume, setCurrentVolume] = useState<Volume | null>(null);
  const [volumeHistory, setVolumeHistory] = useState<Volume[]>([]);
  const [loadingVolumes, setLoadingVolumes] = useState(true);

  const [newStartingNumber, setNewStartingNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [startingVolume, setStartingVolume] = useState(false);

  const loadAccount = useCallback(async () => {
    setShopNameDisplay((await getShopName()) ?? '');
    setBaseUrl(await getApiBaseUrl());
  }, []);

  const loadVolumes = useCallback(async () => {
    setLoadingVolumes(true);
    try {
      const [current, history] = await Promise.all([getCurrentVolume(), listVolumes()]);
      setCurrentVolume(current);
      setVolumeHistory(history);
    } catch {
      // silently keep previous state; user can pull to refresh via screen focus
    } finally {
      setLoadingVolumes(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
      loadVolumes();
    }, [loadAccount, loadVolumes]),
  );

  const handleLogOut = () => {
    Alert.alert('Log out?', 'You can log back in anytime with your email and password (or Google).', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const handleSaveConnection = async () => {
    const trimmedUrl = baseUrl.trim();
    if (!trimmedUrl) {
      Alert.alert('Missing info', 'Please enter a server address.');
      return;
    }

    setSavingConnection(true);
    try {
      const reachable = await testConnection(trimmedUrl);
      await setApiBaseUrl(trimmedUrl);
      Alert.alert('Saved', reachable ? 'Connection settings saved.' : 'Saved, but the server could not be reached just now.');
    } finally {
      setSavingConnection(false);
    }
  };

  const handleStartNewChapter = async () => {
    const value = Number(newStartingNumber.trim());
    if (!newStartingNumber.trim() || Number.isNaN(value) || value < 0) {
      Alert.alert('Invalid number', 'Enter a whole number, e.g. 1900.');
      return;
    }

    const closeWarning = currentVolume
      ? `This closes "${currentVolume.label}" for good — no more receipts can be added to it. `
      : '';

    Alert.alert(
      'Start a new chapter?',
      `${closeWarning}The next receipt will be #${String(value).padStart(5, '0')}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setStartingVolume(true);
            try {
              await startVolume({ startingNumber: value, label: newLabel.trim() || null });
              setNewStartingNumber('');
              setNewLabel('');
              await loadVolumes();
              Alert.alert('Done', `New volume started. Next receipt will be #${String(value).padStart(5, '0')}.`);
            } catch {
              Alert.alert('Error', 'Could not start the new volume. Check your connection and try again.');
            } finally {
              setStartingVolume(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.accountCard}>
        <Text style={styles.accountShopName}>{shopName || 'Your Shop'}</Text>
      </View>
      <TouchableOpacity style={[styles.button, styles.logOutButton]} onPress={handleLogOut}>
        <Text style={styles.logOutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>📖 Current Volume</Text>
      {loadingVolumes ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : currentVolume ? (
        <View style={styles.currentVolumeCard}>
          <Text style={styles.currentVolumeLabel}>{currentVolume.label}</Text>
          <Text style={styles.currentVolumeDetail}>
            Started at #{String(currentVolume.startingNumber).padStart(5, '0')} on{' '}
            {formatDate(currentVolume.createdAt)}
          </Text>
          <Text style={styles.currentVolumeDetail}>
            Next receipt: #{String(currentVolume.nextNumber).padStart(5, '0')}
          </Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>No volume started yet — start one below or from the New Receipt screen.</Text>
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Start New Chapter</Text>
      <Text style={styles.subtitle}>
        Closes the current volume for good and starts a fresh one from whatever number you choose —
        just like starting a new receipt book.
      </Text>
      <Text style={styles.label}>Starting Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="e.g. 1900"
        placeholderTextColor={colors.textMuted}
        value={newStartingNumber}
        onChangeText={setNewStartingNumber}
      />
      <Text style={styles.label}>Volume Name (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Summer Book"
        placeholderTextColor={colors.textMuted}
        value={newLabel}
        onChangeText={setNewLabel}
      />
      <TouchableOpacity
        style={[styles.button, styles.accentButton]}
        onPress={handleStartNewChapter}
        disabled={startingVolume}
      >
        {startingVolume ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start New Chapter</Text>}
      </TouchableOpacity>

      {volumeHistory.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Volume History</Text>
          {volumeHistory.map((v) => (
            <View key={v.id} style={styles.historyRow}>
              <View style={[styles.historyDot, v.isActive && styles.historyDotActive]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyLabel}>{v.label}</Text>
                <Text style={styles.historyDetail}>
                  Started #{String(v.startingNumber).padStart(5, '0')} · {formatDate(v.createdAt)}
                  {v.closedAt ? ` · Closed ${formatDate(v.closedAt)}` : ' · Active'}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced((s) => !s)}
      >
        <Text style={styles.advancedToggleText}>{showAdvanced ? 'Hide' : 'Show'} advanced settings</Text>
      </TouchableOpacity>
      {showAdvanced && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={styles.label}>Server Address (developer use)</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={baseUrl}
            onChangeText={setBaseUrl}
          />
          <TouchableOpacity style={styles.button} onPress={handleSaveConnection} disabled={savingConnection}>
            {savingConnection ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  accentButton: {
    backgroundColor: colors.accent,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
  },
  accountShopName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  logOutButton: {
    backgroundColor: colors.danger,
  },
  logOutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  currentVolumeCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
  },
  currentVolumeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  currentVolumeDetail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  historyDotActive: {
    backgroundColor: colors.success,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  historyDetail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  advancedToggle: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  advancedToggleText: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
