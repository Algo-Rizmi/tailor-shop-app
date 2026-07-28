import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { createReceipt, getCurrentVolume, startVolume } from '../api/client';
import ClothingItemsEditor from '../components/ClothingItemsEditor';
import type { PaymentStatus, ReceiptItem, Volume } from '../types/receipt';
import { PAYMENT_STATUS_LABELS } from '../types/receipt';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewReceipt'>;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NewReceiptScreen({ navigation }: Props) {
  const [volume, setVolume] = useState<Volume | null>(null);
  const [loadingVolume, setLoadingVolume] = useState(true);

  const [startingNumber, setStartingNumber] = useState('');
  const [volumeLabel, setVolumeLabel] = useState('');
  const [startingVolume, setStartingVolume] = useState(false);

  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [price, setPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadVolume();
  }, []);

  const loadVolume = async () => {
    setLoadingVolume(true);
    try {
      const current = await getCurrentVolume();
      setVolume(current);
    } catch {
      Alert.alert('Error', 'Could not reach the server. Check your connection.');
    } finally {
      setLoadingVolume(false);
    }
  };

  const handleStartVolume = async () => {
    const value = Number(startingNumber.trim());
    if (!startingNumber.trim() || Number.isNaN(value) || value < 0) {
      Alert.alert('Invalid number', 'Enter a whole number, e.g. 1900.');
      return;
    }

    setStartingVolume(true);
    try {
      const created = await startVolume({ startingNumber: value, label: volumeLabel.trim() || null });
      setVolume(created);
    } catch {
      Alert.alert('Error', 'Could not start the volume. Check your connection and try again.');
    } finally {
      setStartingVolume(false);
    }
  };

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one clothing item.');
      return;
    }

    setSaving(true);
    try {
      const receipt = await createReceipt({
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items,
        instructions: instructions.trim() || null,
        price: price.trim() ? Number(price.trim()) : null,
        paymentStatus,
        dueDate: dueDate ? toIsoDate(dueDate) : null,
      });
      Alert.alert('Saved', `Receipt #${String(receipt.receiptNumber).padStart(5, '0')} created.`, [
        { text: 'OK', onPress: () => navigation.replace('ReceiptDetail', { id: receipt.id }) },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not save the receipt. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingVolume) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!volume) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.startCard}>
            <Text style={styles.startEmoji}>📖</Text>
            <Text style={styles.startTitle}>Start Your First Volume</Text>
            <Text style={styles.startSubtitle}>
              Pick the number your receipts should start counting from — like the first page of a
              new receipt book (e.g. if your paper book started at 01900, enter 1900).
            </Text>
            <Text style={styles.label}>Starting Number *</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="e.g. 1900"
              placeholderTextColor={colors.textMuted}
              value={startingNumber}
              onChangeText={setStartingNumber}
            />
            <Text style={styles.label}>Volume Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Summer Book"
              placeholderTextColor={colors.textMuted}
              value={volumeLabel}
              onChangeText={setVolumeLabel}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleStartVolume} disabled={startingVolume}>
              {startingVolume ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Start Volume</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>#{String(volume.nextNumber).padStart(5, '0')}</Text>
          <Text style={styles.numberLabel}>Next receipt number · {volume.label}</Text>
        </View>

        <Text style={styles.label}>Customer Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={styles.label}>Customer Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />

        <View style={styles.divider} />

        <ClothingItemsEditor items={items} onChange={setItems} />

        <View style={styles.divider} />

        <Text style={styles.label}>Instructions (what should be done)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Price</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

        <Text style={styles.label}>Payment Status</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={paymentStatus} onValueChange={setPaymentStatus}>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <Picker.Item key={value} label={label} value={value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Due Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>{dueDate ? toIsoDate(dueDate) : 'Select a date'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="date"
            onChange={(_event, selected) => {
              setShowDatePicker(false);
              if (selected) setDueDate(selected);
            }}
          />
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Receipt</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  startCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  startEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  startTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  startSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  numberBadge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  numberText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
  },
  numberLabel: {
    fontSize: 12,
    color: '#EFEBFF',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
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
    alignSelf: 'stretch',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
