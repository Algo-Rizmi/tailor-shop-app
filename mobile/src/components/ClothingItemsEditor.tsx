import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CLOTHING_TYPES, OTHER_CLOTHING_TYPE, emojiForClothingType } from '../constants/clothing';
import type { ReceiptItem } from '../types/receipt';
import { totalItemCount } from '../types/receipt';
import { clothingColorSwatches, colors, spacing } from '../theme';

interface Props {
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
}

export default function ClothingItemsEditor({ items, onChange }: Props) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [customType, setCustomType] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const isOther = selectedType === OTHER_CLOTHING_TYPE;
  const resolvedType = isOther ? customType.trim() : selectedType;

  const handleAdd = () => {
    if (!resolvedType) return;
    onChange([...items, { clothingType: resolvedType, color: color.trim() || null, quantity }]);
    setSelectedType(null);
    setCustomType('');
    setColor('');
    setQuantity(1);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>Clothing Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
        {CLOTHING_TYPES.map((type) => (
          <TouchableOpacity
            key={type.label}
            style={[styles.typeChip, selectedType === type.label && styles.typeChipSelected]}
            onPress={() => setSelectedType(type.label)}
          >
            <Text style={styles.typeChipEmoji}>{type.emoji}</Text>
            <Text style={[styles.typeChipLabel, selectedType === type.label && styles.typeChipLabelSelected]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isOther && (
        <TextInput
          style={styles.input}
          placeholder="Describe the item (e.g. Turban, Scarf...)"
          placeholderTextColor={colors.textMuted}
          value={customType}
          onChangeText={setCustomType}
        />
      )}

      <Text style={styles.sectionLabel}>Color (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. light blue"
        placeholderTextColor={colors.textMuted}
        value={color}
        onChangeText={setColor}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchRow}>
        {clothingColorSwatches.map((swatch) => (
          <TouchableOpacity
            key={swatch.name}
            style={[
              styles.swatch,
              { backgroundColor: swatch.hex },
              swatch.hex === '#FFFFFF' && styles.swatchBordered,
            ]}
            onPress={() => setColor(swatch.name)}
          />
        ))}
      </ScrollView>

      <View style={styles.quantityRow}>
        <Text style={styles.sectionLabel}>Quantity</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{quantity}</Text>
          <TouchableOpacity style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, !resolvedType && styles.addButtonDisabled]}
        onPress={handleAdd}
        disabled={!resolvedType}
      >
        <Text style={styles.addButtonText}>+ Add Item</Text>
      </TouchableOpacity>

      {items.length > 0 && (
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemEmoji}>{emojiForClothingType(item.clothingType)}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemType}>{item.clothingType}</Text>
                {item.color && <Text style={styles.itemColor}>{item.color}</Text>}
              </View>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQtyText}>×{item.quantity}</Text>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemove(index)}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>🧺 Total items: {totalItemCount(items)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  typeRow: {
    marginBottom: spacing.xs,
  },
  typeChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    minWidth: 64,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFEBFF',
  },
  typeChipEmoji: {
    fontSize: 24,
  },
  typeChipLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  typeChipLabelSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
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
    marginTop: spacing.xs,
  },
  swatchRow: {
    marginTop: spacing.sm,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.xs,
  },
  swatchBordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityRow: {
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stepperButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepperButtonText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  itemsList: {
    marginTop: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  itemEmoji: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemColor: {
    fontSize: 12,
    color: colors.textMuted,
  },
  itemQtyBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  itemQtyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  removeButton: {
    padding: spacing.xs,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  totalRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
