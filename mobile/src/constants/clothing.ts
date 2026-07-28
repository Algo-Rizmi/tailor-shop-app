export const OTHER_CLOTHING_TYPE = 'Other';

export interface ClothingTypeOption {
  label: string;
  emoji: string;
}

export const CLOTHING_TYPES: ClothingTypeOption[] = [
  { label: 'Shirt', emoji: '👕' },
  { label: 'Pants', emoji: '👖' },
  { label: 'Jacket', emoji: '🧥' },
  { label: 'Suit', emoji: '🤵' },
  { label: 'Dress', emoji: '👗' },
  { label: 'Robe', emoji: '🥻' },
  { label: 'Coat', emoji: '🥼' },
  { label: 'Skirt', emoji: '👘' },
  { label: 'Blouse', emoji: '👚' },
  { label: 'Vest', emoji: '🦺' },
  { label: OTHER_CLOTHING_TYPE, emoji: '✏️' },
];

export function emojiForClothingType(clothingType: string): string {
  const match = CLOTHING_TYPES.find((t) => t.label.toLowerCase() === clothingType.toLowerCase());
  return match?.emoji ?? '🧵';
}
