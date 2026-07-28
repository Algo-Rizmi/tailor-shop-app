import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { listReceipts } from '../api/client';
import type { Receipt, ReceiptStatus } from '../types/receipt';
import { RECEIPT_STATUS_LABELS, totalItemCount } from '../types/receipt';
import { emojiForClothingType } from '../constants/clothing';
import { colors, spacing } from '../theme';

function itemsSummary(receipt: Receipt): string {
  if (receipt.items.length === 0) return 'No items';
  const emojis = receipt.items.map((i) => emojiForClothingType(i.clothingType)).join(' ');
  return `${emojis}  ·  ${totalItemCount(receipt.items)} item${totalItemCount(receipt.items) === 1 ? '' : 's'}`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ReceiptList'>;

const STATUS_FILTERS: Array<ReceiptStatus | 'All'> = ['All', 'Pending', 'InProgress', 'Ready', 'PickedUp'];

const STATUS_COLORS: Record<ReceiptStatus, string> = {
  Pending: colors.warning,
  InProgress: colors.primary,
  Ready: colors.success,
  PickedUp: colors.textMuted,
};

export default function ReceiptListScreen({ navigation }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const result = await listReceipts({
        status: statusFilter === 'All' ? undefined : statusFilter,
        search: search.trim() || undefined,
        pageSize: 50,
      });
      setReceipts(result.items);
    } catch {
      // keep previous list on failure; user can pull-to-refresh to retry
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name, phone, or number"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => load()}
        returnKeyType="search"
      />

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, statusFilter === filter && styles.filterChipActive]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text style={[styles.filterChipText, statusFilter === filter && styles.filterChipTextActive]}>
              {filter === 'All' ? 'All' : RECEIPT_STATUS_LABELS[filter]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No receipts found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ReceiptDetail', { id: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardNumber}>#{String(item.receiptNumber).padStart(5, '0')}</Text>
                {item.volume && <Text style={styles.cardVolume}>{item.volume.label}</Text>}
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
                <Text style={styles.cardStatus}>{RECEIPT_STATUS_LABELS[item.status]}</Text>
              </View>
              <Text style={styles.cardName}>{item.customerName || 'Walk-in Customer'}</Text>
              <Text style={styles.cardDescription} numberOfLines={1}>
                {itemsSummary(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewReceipt')}>
        <Text style={styles.fabText}>+ New Receipt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  cardVolume: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  cardStatus: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    left: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
