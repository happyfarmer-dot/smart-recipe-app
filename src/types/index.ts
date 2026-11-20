export interface CompressedImage {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

export interface IngredientItem {
  id: string;
  name: string;
  status: string;
  isManual?: boolean;
}

export type SeasoningCategoryId =
  | 'basic'
  | 'chinese'
  | 'aromatics'
  | 'oils_flours'
  | 'custom';

export interface SeasoningGroup {
  id: SeasoningCategoryId;
  label: string;
  description: string;
  items: string[];
}

export type ServingsOption = '1人' | '2人' | '3-4人';
export type MaxTimeOption = '15分鐘內' | '30分鐘內' | '不限';
export type EquipmentOption = '平底鍋' | '電鍋' | '氣炸鍋' | '舒肥機' | '不限';

export interface RecipeFilters {
  servings: ServingsOption;
  maxTime: MaxTimeOption;
  equipment: EquipmentOption;
}

export interface RecipeIngredientUsage {
  name: string;
  amount: string;
}

export type RecipeDifficulty = '簡單' | '中等' | '進階';

export interface Recipe {
  id: string;
  title: string;
  matchScore: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  usedIngredients: RecipeIngredientUsage[];
  usedSeasonings: RecipeIngredientUsage[];
  missingOptional: string[];
  steps: string[];
  tips: string;
  createdAt?: number;
}

export interface AppSettings {
  apiKey: string;
  modelName: string;
}

export type AppStep = 1 | 2 | 3;
