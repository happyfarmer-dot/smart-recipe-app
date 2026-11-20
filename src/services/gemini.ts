import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  CompressedImage,
  DualTrackRecipeResult,
  GeminiModelOption,
  IngredientItem,
  Recipe,
  RecipeCategory,
  RecipeDifficulty,
  RecipeFilters,
} from '../types';
import { DEFAULT_MODEL_NAME } from '../constants/seasonings';

export function getEffectiveApiKey(settingsApiKey?: string): string {
  const trimmed = settingsApiKey?.trim();
  if (trimmed) return trimmed;
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return envKey?.trim() || '';
}

export function hasEnvApiKey(): boolean {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return Boolean(envKey?.trim());
}

function createClient(apiKey: string): GoogleGenAI {
  if (!apiKey) {
    throw new Error('尚未設定 Gemini API Key，請前往「設定」輸入您的 API Key。');
  }
  return new GoogleGenAI({ apiKey });
}

function normalizeGeminiError(error: unknown, fallbackMsg: string): Error {
  if (error instanceof Error) {
    const msg = error.message || '';
    const lower = msg.toLowerCase();

    if (
      msg.includes('尚未設定 Gemini API Key') ||
      msg.includes('無法辨識出任何食材') ||
      msg.includes('AI 未回傳')
    ) {
      return error;
    }
    if (
      lower.includes('api_key_invalid') ||
      lower.includes('api key not valid') ||
      lower.includes('400') ||
      lower.includes('401') ||
      lower.includes('403')
    ) {
      return new Error(
        'Gemini API Key 無效或權限不足（400/403），請前往「設定」檢查並重新驗證您的 API Key。'
      );
    }
    if (lower.includes('404') || lower.includes('not found')) {
      return new Error(
        '找不到指定的 AI 模型或該模型不支援此功能（404）。請前往「設定」點擊「驗證並載入可用模型」切換其他模型。'
      );
    }
    if (
      lower.includes('429') ||
      lower.includes('quota') ||
      lower.includes('resource_exhausted') ||
      lower.includes('rate limit')
    ) {
      return new Error(
        'API 呼叫次數或免費額度已達上限（429），請稍候片刻再試，或於設定中切換其他模型。'
      );
    }
    if (
      lower.includes('network') ||
      lower.includes('failed to fetch') ||
      lower.includes('err_internet_disconnected')
    ) {
      return new Error(
        '網路連線異常，無法連接至 Gemini API，請檢查網路狀態後重試。'
      );
    }
    return new Error(`${fallbackMsg}（${msg}）`);
  }
  return new Error(fallbackMsg);
}

interface RawGeminiModel {
  name?: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

interface ListModelsResponse {
  models?: RawGeminiModel[];
  error?: { message?: string; code?: number };
}

/**
 * 動態呼叫 Gemini REST API 列出此 API Key 可用的 generateContent 模型
 */
export async function listModels(apiKey: string): Promise<{
  models: GeminiModelOption[];
  recommendedModelId: string;
}> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('請先輸入 Gemini API Key 再進行驗證。');
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );
    const data = (await res.json()) as ListModelsResponse;

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      throw new Error(errMsg);
    }

    const rawModels = data.models ?? [];
    const usable = rawModels
      .filter(
        (m) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          Boolean(m.name)
      )
      .map((m) => {
        const id = (m.name ?? '').replace(/^models\//, '');
        return {
          id,
          displayName: m.displayName || id,
          description: m.description || '',
        };
      });

    if (usable.length === 0) {
      throw new Error('此 API Key 沒有任何支援 generateContent 的可用模型。');
    }

    // 優先選取包含 flash 且較新的模型作為預設推薦
    const flashModels = usable.filter((m) =>
      m.id.toLowerCase().includes('flash')
    );
    const preferred =
      flashModels.find((m) => m.id.includes('2.5-flash')) ||
      flashModels.find((m) => m.id.includes('2.0-flash')) ||
      flashModels[0] ||
      usable[0];

    return {
      models: usable,
      recommendedModelId: preferred.id,
    };
  } catch (error) {
    throw normalizeGeminiError(error, '無法取得可用模型清單');
  }
}

const ingredientRecognitionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      description: '從所有照片中辨識並合併去重後的食材清單',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: '台灣慣用的繁體中文食材名稱，例如：雞胸肉、高麗菜、雞蛋',
          },
          status: {
            type: Type.STRING,
            description: '食材的估計狀態或數量描述，例如：新鮮約半顆、2顆、約300克',
          },
        },
        required: ['name', 'status'],
      },
    },
  },
  required: ['ingredients'],
};

interface RawIngredientResponse {
  ingredients?: Array<{ name?: string; status?: string }>;
}

/**
 * 階段一：多圖一次送交 Gemini Vision API 辨識食材並跨照片合併去重
 */
export async function recognizeIngredientsFromImages(
  images: CompressedImage[],
  apiKey: string,
  modelName: string = DEFAULT_MODEL_NAME
): Promise<IngredientItem[]> {
  if (images.length === 0) {
    throw new Error('請先拍攝或上傳至少一張食材照片。');
  }

  try {
    const ai = createClient(apiKey);
    const model = modelName.trim() || DEFAULT_MODEL_NAME;

    const imageParts = images.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    }));

    const prompt = `你是一位專業的台灣家庭料理顧問與食材辨識專家。
請仔細檢視使用者上傳的這 ${images.length} 張食材照片，辨識出所有可見的生鮮食材、肉類、海鮮、蔬菜、蛋奶豆製品或主食類（不包含瓶裝調味料）。

規則：
1. 必須使用「台灣繁體中文」與台灣常見食材名稱（例如：高麗菜、青江菜、雞胸肉、梅花豬、板豆腐、雞蛋、牛番茄、鴻喜菇）。
2. 為每項食材填寫簡短的估計狀態或份量（例如：「新鮮約半顆」、「3顆」、「約300克」）。
3. **跨照片合併去重**：若多張照片中有重複拍到的同一份食材，請合併為單一項目，絕對不要重複列出。
4. 若照片中完全看不出任何食物或食材（例如全黑、純風景、模糊無法辨認），請回傳空陣列 []。`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [...imageParts, { text: prompt }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ingredientRecognitionSchema,
        temperature: 0.2,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('AI 未回傳任何辨識結果，請重試。');
    }

    const parsed = JSON.parse(text) as RawIngredientResponse;
    const rawList = parsed.ingredients ?? [];

    if (rawList.length === 0) {
      throw new Error(
        '照片中無法辨識出任何食材。請確認光線充足與對焦清楚，或使用下方「手動新增食材」功能。'
      );
    }

    const seen = new Set<string>();
    const results: IngredientItem[] = [];

    for (const item of rawList) {
      const name = (item.name ?? '').trim();
      const status = (item.status ?? '現有食材').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      results.push({
        id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        status: status || '現有食材',
        isManual: false,
      });
    }

    if (results.length === 0) {
      throw new Error('無法解析有效的食材名稱，請重新拍攝或手動新增。');
    }

    return results;
  } catch (error) {
    throw normalizeGeminiError(error, '食材辨識失敗');
  }
}

const recipeItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: '唯一識別碼，例如 rec_1' },
    title: { type: Type.STRING, description: '台灣繁體中文菜名' },
    category: {
      type: Type.STRING,
      description: '只能是 ready 或 unlockable',
    },
    cookTimeMinutes: { type: Type.INTEGER, description: '預估總烹調時間（分鐘）' },
    difficulty: {
      type: Type.STRING,
      description: '只能是：簡單、中等、進階 其中之一',
    },
    dietaryTags: {
      type: Type.ARRAY,
      description: '符合的飲食標籤，例如：高蛋白、低碳水、低油清爽、快速備餐',
      items: { type: Type.STRING },
    },
    nutrition: {
      type: Type.OBJECT,
      description: '每份預估巨量營養素',
      properties: {
        calories: { type: Type.INTEGER, description: '預估熱量（大卡 kcal）' },
        proteinGrams: { type: Type.INTEGER, description: '蛋白質（克）' },
        carbsGrams: { type: Type.INTEGER, description: '碳水化合物（克）' },
        fatGrams: { type: Type.INTEGER, description: '脂肪（克）' },
      },
      required: ['calories', 'proteinGrams', 'carbsGrams', 'fatGrams'],
    },
    usedIngredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
        },
        required: ['name', 'amount'],
      },
    },
    usedSeasonings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
        },
        required: ['name', 'amount'],
      },
    },
    missingKeyIngredients: {
      type: Type.ARRAY,
      description: '缺少的關鍵食材；ready 類型必須為空陣列 []，unlockable 類型為 1-2 項',
      items: { type: Type.STRING },
    },
    steps: {
      type: Type.ARRAY,
      description: '條列式烹調步驟，語氣明確、含火候與時間提示',
      items: { type: Type.STRING },
    },
    tips: {
      type: Type.STRING,
      description: '料理關鍵技巧或替代方案',
    },
  },
  required: [
    'id',
    'title',
    'category',
    'cookTimeMinutes',
    'difficulty',
    'dietaryTags',
    'nutrition',
    'usedIngredients',
    'usedSeasonings',
    'missingKeyIngredients',
    'steps',
    'tips',
  ],
};

const dualTrackRecipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    readyRecipes: {
      type: Type.ARRAY,
      description: '100% 僅使用現有食材與已勾選調味料即可完成的食譜（至少 3 道）',
      items: recipeItemSchema,
    },
    unlockableRecipes: {
      type: Type.ARRAY,
      description: '僅需額外購買 1-2 項關鍵食材即可大幅升級風味的進階食譜',
      items: recipeItemSchema,
    },
  },
  required: ['readyRecipes', 'unlockableRecipes'],
};

interface RawRecipeItem {
  id?: string;
  title?: string;
  category?: string;
  cookTimeMinutes?: number;
  difficulty?: string;
  dietaryTags?: string[];
  nutrition?: {
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
  };
  usedIngredients?: Array<{ name?: string; amount?: string }>;
  usedSeasonings?: Array<{ name?: string; amount?: string }>;
  missingKeyIngredients?: string[];
  steps?: string[];
  tips?: string;
}

interface RawDualTrackResponse {
  readyRecipes?: RawRecipeItem[];
  unlockableRecipes?: RawRecipeItem[];
}

function normalizeDifficulty(val?: string): RecipeDifficulty {
  if (val === '中等' || val === '進階') return val;
  return '簡單';
}

function mapRecipeItem(
  raw: RawRecipeItem,
  category: RecipeCategory,
  idx: number
): Recipe {
  const uniqueId = `rec_${category}_${Date.now()}_${idx}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  return {
    id: uniqueId,
    title: (raw.title || `家常料理 ${idx + 1}`).trim(),
    category,
    cookTimeMinutes: Math.max(1, Math.round(raw.cookTimeMinutes ?? 15)),
    difficulty: normalizeDifficulty(raw.difficulty),
    dietaryTags: (raw.dietaryTags ?? []).filter((t) => Boolean(t?.trim())),
    nutrition: {
      calories: Math.max(0, Math.round(raw.nutrition?.calories ?? 350)),
      proteinGrams: Math.max(0, Math.round(raw.nutrition?.proteinGrams ?? 18)),
      carbsGrams: Math.max(0, Math.round(raw.nutrition?.carbsGrams ?? 25)),
      fatGrams: Math.max(0, Math.round(raw.nutrition?.fatGrams ?? 12)),
    },
    usedIngredients: (raw.usedIngredients ?? []).map((u) => ({
      name: (u.name ?? '').trim(),
      amount: (u.amount ?? '適量').trim(),
    })),
    usedSeasonings: (raw.usedSeasonings ?? []).map((s) => ({
      name: (s.name ?? '').trim(),
      amount: (s.amount ?? '適量').trim(),
    })),
    missingKeyIngredients:
      category === 'ready'
        ? []
        : (raw.missingKeyIngredients ?? []).filter((m) => Boolean(m?.trim())),
    steps: (raw.steps ?? []).filter((s) => Boolean(s?.trim())),
    tips: (raw.tips ?? '注意火候控制，起鍋前試味道做最後微調即可。').trim(),
    createdAt: Date.now(),
  };
}

/**
 * 階段三：雙軌食譜生成（readyRecipes + unlockableRecipes）
 */
export async function generateDualTrackRecipes(params: {
  ingredients: IngredientItem[];
  seasonings: string[];
  filters: RecipeFilters;
  apiKey: string;
  modelName?: string;
}): Promise<DualTrackRecipeResult> {
  const {
    ingredients,
    seasonings,
    filters,
    apiKey,
    modelName = DEFAULT_MODEL_NAME,
  } = params;

  if (ingredients.length === 0) {
    throw new Error('請至少確認一項食材，才能為您生成食譜。');
  }

  try {
    const ai = createClient(apiKey);
    const model = modelName.trim() || DEFAULT_MODEL_NAME;

    const ingredientText = ingredients
      .map((i) => `- ${i.name}（${i.status}）`)
      .join('\n');

    const seasoningText =
      seasonings.length > 0
        ? seasonings.join('、')
        : '（使用者未勾選任何調味料，請僅使用食材原味與清水烹調）';

    const unlockInstruction = filters.enableUnlockMode
      ? '2. **unlockableRecipes（產生 2 道）**：僅需額外購買 1–2 項關鍵食材即可大幅升級風味的料理。必須在 missingKeyIngredients 中明確列出缺少的食材（例如：「九層塔 1把」、「杏鮑菇 2根」），category 設為 "unlockable"。'
      : '2. **unlockableRecipes**：使用者未開啟解鎖模式，請回傳空陣列 []。';

    const prompt = `你是一位擁有 20 年經驗的台灣家常菜與營養師主廚。
請根據使用者「現有食材」、「現有調味料」與「料理條件」，回傳雙軌食譜 JSON 物件。

【現有已確認食材】
${ingredientText}

【現有已勾選調味料】
${seasoningText}

【使用者條件過濾】
- 預計份量：${filters.servings}
- 料理時間上限：${filters.maxTime}
- 烹調設備偏好：${filters.equipment}
- 飲食目標：${filters.dietaryGoal}

【嚴格規則（務必遵守）】
1. **readyRecipes（至少 3 道）**：必須 100% 僅使用上述現有食材與已勾選調味料即可完成，嚴禁偷渡未勾選調味料，missingKeyIngredients 必須為空陣列 []，category 設為 "ready"。
${unlockInstruction}
3. **飲食目標與營養估算**：每道食譜都必須符合飲食目標（若為「不限」則均衡搭配），並在 nutrition 物件中估算每份的 calories（大卡）、proteinGrams（克）、carbsGrams（克）、fatGrams（克）。
4. **台灣繁體中文與單位**：全程強制使用台灣繁體中文與台灣慣用單位（大匙、小匙、克、毫升、顆、片）。
5. **步驟清晰度**：steps 必須條列分明、語氣明確，包含火候（如中小火、大火）與時間提示（如翻炒 2 分鐘）。`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: dualTrackRecipeSchema,
        temperature: 0.7,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('AI 未回傳任何食譜，請點擊「重新生成」再試一次。');
    }

    const parsed = JSON.parse(text) as RawDualTrackResponse;
    const readyList = (parsed.readyRecipes ?? []).map((r, i) =>
      mapRecipeItem(r, 'ready', i)
    );
    const unlockableList = filters.enableUnlockMode
      ? (parsed.unlockableRecipes ?? []).map((r, i) =>
          mapRecipeItem(r, 'unlockable', i)
        )
      : [];

    if (readyList.length === 0 && unlockableList.length === 0) {
      throw new Error('AI 未能生成有效食譜，請點擊「重新生成」再試一次。');
    }

    return {
      readyRecipes: readyList,
      unlockableRecipes: unlockableList,
    };
  } catch (error) {
    throw normalizeGeminiError(error, '生成食譜時發生錯誤');
  }
}
