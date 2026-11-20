import { GoogleGenAI, Type } from '@google/genai';
import type {
  CompressedImage,
  IngredientItem,
  Recipe,
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
    throw new Error('尚未設定 Gemini API Key，請點擊右上角「設定」輸入您的 API Key。');
  }
  return new GoogleGenAI({ apiKey });
}

function normalizeGeminiError(error: unknown, fallbackMsg: string): Error {
  if (error instanceof Error) {
    const msg = error.message || '';
    const lower = msg.toLowerCase();

    if (msg.includes('尚未設定 Gemini API Key')) {
      return error;
    }
    if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('401') || lower.includes('403')) {
      return new Error('Gemini API Key 無效或權限不足，請檢查設定中的 API Key 是否正確。');
    }
    if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('rate limit')) {
      return new Error('API 呼叫次數或免費額度已達上限，請稍候片刻再試，或於設定中切換模型。');
    }
    if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('fetch')) {
      return new Error('網路連線異常，無法連接至 Gemini API，請檢查網路狀態後重試。');
    }
    if (lower.includes('404') || lower.includes('not found')) {
      return new Error('找不到指定的 Gemini 模型名稱，請至「設定」確認模型名稱是否正確（例如 gemini-2.5-flash）。');
    }
    if (msg) {
      return new Error(`${fallbackMsg}（${msg}）`);
    }
  }
  return new Error(fallbackMsg);
}

const ingredientRecognitionSchema = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      description: '從照片中辨識出的所有食材清單',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: '台灣慣用的繁體中文食材名稱，例如：雞胸肉、高麗菜、雞蛋、牛番茄',
          },
          status: {
            type: Type.STRING,
            description: '食材的估計狀態或份量描述，例如：新鮮約300克、半顆、2顆、已切塊',
          },
        },
        required: ['name', 'status'],
      },
    },
  },
  required: ['ingredients'],
};

export async function recognizeIngredientsFromImages(
  images: CompressedImage[],
  apiKey: string,
  modelName: string = DEFAULT_MODEL_NAME
): Promise<IngredientItem[]> {
  if (images.length === 0) {
    throw new Error('請先拍照或上傳至少一張食材照片。');
  }

  try {
    const ai = createClient(apiKey);

    const imageParts = images.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    }));

    const prompt = `你是一位專業的台灣家常料理主廚與食材辨識專家。
請仔細檢視使用者上傳的冰箱或食材照片，辨識出所有看得到的可烹調食材（例如肉類、海鮮、蔬菜、蛋豆類、主食等）。
規則：
1. 請使用「台灣繁體中文」與台灣常見食材名稱（例如：青蔥、高麗菜、雞胸肉、板豆腐、小黃瓜、杏鮑菇）。
2. 請為每項食材提供簡短的估計狀態或數量（例如：「約半顆」、「3顆」、「盒裝約300克」、「新鮮完整」）。
3. 忽略純包裝垃圾、餐具或非食材物品；若照片中完全沒有可辨識的食材，請回傳空陣列 []。
4. 若多張照片拍到同一種食材，請合併為一項並綜合估計狀態。`;

    const response = await ai.models.generateContent({
      model: modelName || DEFAULT_MODEL_NAME,
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

    const text = response.text;
    if (!text) {
      throw new Error('AI 未回傳任何辨識結果，請重試。');
    }

    const parsed = JSON.parse(text) as {
      ingredients?: Array<{ name?: string; status?: string }>;
    };

    const rawList = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    const items: IngredientItem[] = rawList
      .filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0)
      .map((item, index) => ({
        id: `ing_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.name!.trim(),
        status: (item.status || '適量').trim(),
        isManual: false,
      }));

    if (items.length === 0) {
      throw new Error('照片中未能辨識出明確的食材，建議調整光線重拍，或直接手動新增食材。');
    }

    return items;
  } catch (error) {
    throw normalizeGeminiError(error, '食材辨識失敗，請稍後重試');
  }
}

const recipeGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    recipes: {
      type: Type.ARRAY,
      description: '推薦的家常食譜清單（3至5道）',
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: '道地、吸引人的繁體中文菜名',
          },
          matchScore: {
            type: Type.INTEGER,
            description: '現有食材與調味料符合度百分比（0 到 100 的整數）',
          },
          cookTimeMinutes: {
            type: Type.INTEGER,
            description: '預估總料理時間（分鐘）',
          },
          difficulty: {
            type: Type.STRING,
            description: '料理難度，僅限：「簡單」、「中等」、「進階」三選一',
          },
          usedIngredients: {
            type: Type.ARRAY,
            description: '使用的現有食材與建議份量',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: '食材名稱' },
                amount: { type: Type.STRING, description: '建議份量（使用台灣慣用單位如克、顆、把、片）' },
              },
              required: ['name', 'amount'],
            },
          },
          usedSeasonings: {
            type: Type.ARRAY,
            description: '使用的現有調味料與精確比例（例如：醬油 1 大匙、鹽 1/2 小匙）',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: '調味料名稱（必須來自使用者勾選清單，或清水）' },
                amount: { type: Type.STRING, description: '精確比例與單位（例如：1 大匙、1/2 小匙、少許）' },
              },
              required: ['name', 'amount'],
            },
          },
          missingOptional: {
            type: Type.ARRAY,
            description: '缺少但建議搭配的可選食材或配料（最多1-2項，若100%使用現有食材則為空陣列 []）',
            items: { type: Type.STRING },
          },
          steps: {
            type: Type.ARRAY,
            description: '條列式烹調步驟，語氣明確並包含火候（大火/中小火）與時間提示',
            items: { type: Type.STRING },
          },
          tips: {
            type: Type.STRING,
            description: '料理關鍵技巧、火候提醒或食材替代方案',
          },
        },
        required: [
          'title',
          'matchScore',
          'cookTimeMinutes',
          'difficulty',
          'usedIngredients',
          'usedSeasonings',
          'missingOptional',
          'steps',
          'tips',
        ],
      },
    },
  },
  required: ['recipes'],
};

export async function generateRecipes(params: {
  ingredients: IngredientItem[];
  seasonings: string[];
  filters: RecipeFilters;
  apiKey: string;
  modelName?: string;
}): Promise<Recipe[]> {
  const { ingredients, seasonings, filters, apiKey, modelName = DEFAULT_MODEL_NAME } = params;

  if (ingredients.length === 0) {
    throw new Error('請至少確認一項食材後再生成食譜。');
  }

  try {
    const ai = createClient(apiKey);

    const ingredientText = ingredients
      .map((ing) => `- ${ing.name}（狀態：${ing.status}）`)
      .join('\n');

    const seasoningText =
      seasonings.length > 0 ? seasonings.join('、') : '（使用者未勾選任何調味料，僅可使用清水與食材原味）';

    const prompt = `你是一位精通台灣家常菜與創意料理的資深主廚。請根據以下使用者手邊現有的食材、調味料與條件，設計 4 道（至少 3 道，最多 5 道）美味且可立即動手做的食譜。

【現有食材清單】
${ingredientText}

【現有調味料清單】
${seasoningText}

【料理條件】
- 份量：${filters.servings}
- 料理時間上限：${filters.maxTime}
- 烹調設備偏好：${filters.equipment}

【嚴格約束規則】
1. **優先 100% 零採買完成**：至少前 3 道食譜必須「100% 僅使用上述現有食材與現有調味料（以及日常飲用水/清水）」即可完成，此時 \`missingOptional\` 必須為空陣列 \`[]\`，且 \`matchScore\` 應為 95–100。
2. **嚴禁偷渡未列出的調味料**：絕對不可在 \`usedSeasonings\` 或 \`steps\` 中出現使用者「現有調味料清單」以外的調味料！若真的需要額外補充極少數非核心食材（最多 1–2 項），必須明確列入 \`missingOptional\` 欄位並標註「（可省略）」，且不能影響主菜完成。
3. **台灣繁體中文與計量單位**：全程使用台灣繁體中文，計量單位必須使用「大匙」、「小匙」、「克」、「毫升」、「顆」、「片」等台灣慣用單位。
4. **步驟清晰可執行**：\`steps\` 每一條都要包含具體動作、火候（例如：中小火、中大火、電鍋外鍋1杯水）與時間提示（例如：拌炒約 2 分鐘）。
5. **符合設備與時間限制**：若使用者指定了特定設備（如「電鍋」或「氣炸鍋」）或時間上限（如「15分鐘內」），請務必遵守該條件設計料理方式。
6. **難度標記**：\`difficulty\` 只能是「簡單」、「中等」或「進階」。`;

    const response = await ai.models.generateContent({
      model: modelName || DEFAULT_MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: recipeGenerationSchema,
        temperature: 0.5,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI 未回傳任何食譜內容，請重試。');
    }

    const parsed = JSON.parse(text) as { recipes?: Array<Partial<Recipe>> };
    const rawRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

    if (rawRecipes.length === 0) {
      throw new Error('無法根據目前食材組合生成食譜，請嘗試補充食材或放寬條件後重試。');
    }

    const validDifficulties: RecipeDifficulty[] = ['簡單', '中等', '進階'];

    return rawRecipes.map((r, index) => ({
      id: `recipe_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      title: (r.title || `家常料理 #${index + 1}`).trim(),
      matchScore: typeof r.matchScore === 'number' ? Math.min(100, Math.max(0, Math.round(r.matchScore))) : 90,
      cookTimeMinutes: typeof r.cookTimeMinutes === 'number' && r.cookTimeMinutes > 0 ? Math.round(r.cookTimeMinutes) : 20,
      difficulty: validDifficulties.includes(r.difficulty as RecipeDifficulty)
        ? (r.difficulty as RecipeDifficulty)
        : '簡單',
      usedIngredients: Array.isArray(r.usedIngredients) ? r.usedIngredients : [],
      usedSeasonings: Array.isArray(r.usedSeasonings) ? r.usedSeasonings : [],
      missingOptional: Array.isArray(r.missingOptional) ? r.missingOptional : [],
      steps: Array.isArray(r.steps) ? r.steps : [],
      tips: (r.tips || '').trim(),
      createdAt: Date.now(),
    }));
  } catch (error) {
    throw normalizeGeminiError(error, '生成食譜失敗，請稍後重試');
  }
}
