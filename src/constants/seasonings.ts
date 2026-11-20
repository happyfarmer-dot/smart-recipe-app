import type { SeasoningGroup } from '../types';

export const DEFAULT_SEASONING_GROUPS: SeasoningGroup[] = [
  {
    id: 'basic',
    label: '基礎調味',
    description: '日常家常料理必備的鹹、甜、酸、辣與去腥基底',
    items: ['鹽', '白糖/冰糖', '黑胡椒', '白胡椒', '米酒', '白醋', '烏醋'],
  },
  {
    id: 'chinese',
    label: '中式醬料',
    description: '台式熱炒、滷煮、拌麵與沾醬常用靈魂醬料',
    items: ['醬油', '醬油膏', '蠔油', '香油', '麻油', '豆瓣醬', '沙茶醬', '番茄醬', '辣椒醬'],
  },
  {
    id: 'aromatics',
    label: '辛香料（常備/乾料）',
    description: '爆香提味與異國風味乾料',
    items: ['蒜頭', '薑', '蔥', '辣椒', '五香粉', '咖哩粉', '義式綜合香料', '辣椒粉'],
  },
  {
    id: 'oils_flours',
    label: '油品與粉類',
    description: '煎炒油脂、勾芡與裹粉用料',
    items: ['沙拉油/橄欖油', '奶油', '太白粉/玉米粉', '麵粉'],
  },
];

export const BASIC_SEASONING_ITEMS: string[] = DEFAULT_SEASONING_GROUPS[0].items;

export const DEFAULT_SELECTED_SEASONINGS: string[] = [
  '鹽',
  '白糖/冰糖',
  '醬油',
  '米酒',
  '蒜頭',
  '沙拉油/橄欖油',
];

export const DEFAULT_MODEL_NAME = 'gemini-2.5-flash';

export const MODEL_PRESETS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash（推薦・快速多模態）' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro（進階推理）' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash（穩定輕量）' },
];
