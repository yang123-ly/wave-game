import type { PetSpecies } from '../services/petApi';

export const SPECIES_OPTIONS: ReadonlyArray<{
  id: PetSpecies;
  label: string;
  emoji: string;
}> = [
  { id: 'cat', label: '猫咪', emoji: '🐱' },
  { id: 'dog', label: '小狗', emoji: '🐶' },
  { id: 'dragon', label: '幼龙', emoji: '🐲' },
  { id: 'bird', label: '小鸟', emoji: '🐤' },
  { id: 'rabbit', label: '兔子', emoji: '🐰' },
];

export const speciesEmoji = (s: string): string =>
  SPECIES_OPTIONS.find((o) => o.id === s)?.emoji ?? '🐾';

export const speciesLabel = (s: string): string =>
  SPECIES_OPTIONS.find((o) => o.id === s)?.label ?? s;

export const MAX_PETS_PER_USER = 6;

/** 心情值映射到 emoji */
export const moodEmoji = (mood: number): string => {
  if (mood >= 80) return '😊';
  if (mood >= 60) return '🙂';
  if (mood >= 30) return '😐';
  if (mood >= 10) return '😢';
  return '😭';
};
