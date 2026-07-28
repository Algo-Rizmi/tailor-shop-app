import { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { getReceipt, updateReceipt } from '../api/client';
import ClothingItemsEditor from '../components/ClothingItemsEditor';
import type { PaymentStatus, Receipt, ReceiptItem, ReceiptStatus } from '../types/receipt';
import { PAYMENT_STATUS_LABELS, RECEIPT_STATUS_LABELS } from '../types/receipt';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptDetail'>;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReceiptDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [price, setPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [status, setStatus] = useState<ReceiptStatus>('Pending');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReceipt(id);
      setReceipt(data);
      setCustomerName(data.customerName);
      setCustomerPhone(data.customerPhone ?? '');
      setItems(data.items);
      setInstructions(data.instructions ?? '');
      setPrice(data.price != null ? String(data.price) : '');
      setPaymentStatus(data.paymentStatus);
      setStatus(data.status);
      setDueDate(data.dueDate ? new Date(`${data.dueDate}T00:00:00`) : null);
      navigation.setOptions({
        title: `#${String(data.receiptNumber).padStart(5, '0')}${data.volume ? ` · ${data.volume.label}` : ''}`,
      });
    } catch {
      Alert.alert('Error', 'Could not load this receipt.');
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one clothing item.');
      return;
    }

    setSaving(true);
    try {
      await updateReceipt(id, {
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items,
        instructions: instructions.trim() || null,
        price: price.trim() ? Number(price.trim()) : null,
        paymentStatus,
        status,
        dueDate: dueDate ? toIsoDate(dueDate) : null,
      });
      Alert.alert('Saved', 'Receipt updated.');
    } catch {
      Alert.alert('Error', 'Could not save changes. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !receipt) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} placeholder="Optional" placeholderTextColor={colors.textMuted} value={customerName} onChangeText={setCustomerName} />

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

        <Text style={styles.label}>Instructions</Text>
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

        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={status} onValueChange={setStatus}>
            {Object.entries(RECEIPT_STATUS_LABELS).map(([value, label]) => (
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
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
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
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
