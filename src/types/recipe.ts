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
export type CuisineStyleOption =
  | '不限'
  | '台式'
  | '中式'
  | '日式'
  | '韓式'
  | '義式'
  | '泰式'
  | '美式/西式';

export type DietaryGoalOption =
  | '不限'
  | '健康餐'
  | '減脂餐'
  | '增肌餐'
  | '生酮飲食'
  | '地中海料理'
  | '蔬食'
  | '高蛋白'
  | '低碳水'
  | '低油清爽'
  | '快速備餐';

export interface RecipeFilters {
  servings: ServingsOption;
  maxTime: MaxTimeOption;
  equipment: EquipmentOption;
  cuisineStyle: CuisineStyleOption;
  dietaryGoal: DietaryGoalOption;
  enableUnlockMode: boolean;
}

export interface RecipeIngredientUsage {
  name: string;
  amount: string;
}

export type RecipeDifficulty = '簡單' | '中等' | '進階';
export type RecipeCategory = 'ready' | 'unlockable';

export interface NutritionInfo {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  dietaryTags: string[];
  nutrition: NutritionInfo;
  usedIngredients: RecipeIngredientUsage[];
  usedSeasonings: RecipeIngredientUsage[];
  missingKeyIngredients: string[];
  steps: string[];
  tips: string;
  createdAt?: number;
}

export interface DualTrackRecipeResult {
  readyRecipes: Recipe[];
  unlockableRecipes: Recipe[];
}

export interface GeminiModelOption {
  id: string;
  displayName: string;
  description?: string;
}

export interface AppSettings {
  apiKey: string;
  modelName: string;
}

export type SeasoningStockStatus = '充足' | '快用完';

export interface SeasoningInventoryMeta {
  stockStatus: SeasoningStockStatus;
  note: string;
}

export type AppStep = 1 | 2 | 3;
export type MainTab = 'cook' | 'pantry' | 'favorites' | 'settings';
