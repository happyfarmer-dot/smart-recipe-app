import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Clock,
  Flame,
  CheckCircle2,
  Check,
  Lightbulb,
  AlertTriangle,
  Utensils,
  Sparkles,
  Maximize2,
  Sun,
  Copy,
} from 'lucide-react';
import type { Recipe } from '../types';
import { useWakeLock } from '../hooks/useWakeLock';
import { CookingFocusMode } from './CookingFocusMode';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isFavorite: boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isFavorite,
  onToggleFavorite,
  onClose,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [copiedMissing, setCopiedMissing] = useState(false);

  const wakeLock = useWakeLock(Boolean(recipe));

  useEffect(() => {
    setCheckedSteps({});
    setIsFocusMode(false);
    setCopiedMissing(false);
  }, [recipe?.id]);

  if (!recipe) return null;

  if (isFocusMode) {
    return (
      <CookingFocusMode
        recipe={recipe}
        wakeLockActive={wakeLock.isActive}
        onExit={() => setIsFocusMode(false)}
      />
    );
  }

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyMissing = async () => {
    const text = `【${recipe.title}】缺料採買清單：\n${recipe.missingKeyIngredients
      .map((item) => `- ${item}`)
      .join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMissing(true);
      setTimeout(() => setCopiedMissing(false), 2000);
    } catch {
      // Fallback
    }
  };

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const totalSteps = recipe.steps.length;
  const progressPct =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#FAF8F5] shadow-2xl sm:rounded-3xl">
        {/* Modal 頂部列 */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF5F0] px-2.5 py-0.5 text-xs font-bold text-[#2F6B4F]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {recipe.category === 'ready'
                  ? '100% 現有食材可做'
                  : `差 ${recipe.missingKeyIngredients.length} 樣解鎖`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                <Clock className="h-3.5 w-3.5 text-stone-500" />
                {recipe.cookTimeMinutes} 分鐘
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                <Flame className="h-3.5 w-3.5 text-[#C84B31]" />
                {recipe.difficulty}
              </span>
            </div>
            <h2
              id="recipe-detail-title"
              className="text-xl font-bold text-stone-900 sm:text-2xl"
            >
              {recipe.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(recipe)}
              id="modal-toggle-favorite-btn"
              className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                isFavorite
                  ? 'border-rose-200 bg-rose-50 text-[#C84B31]'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-[#C84B31] text-[#C84B31]' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {isFavorite ? '已收藏' : '收藏'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="關閉食譜詳情"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 廚房實戰工具列：專注模式 + 螢幕防休眠 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setIsFocusMode(true)}
            id="enter-focus-mode-btn"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-stone-800 active:scale-[0.98]"
          >
            <Maximize2 className="h-4 w-4 text-amber-300" />
            <span>進入料理專注模式</span>
          </button>

          <div className="flex items-center gap-2">
            {wakeLock.isSupported ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={wakeLock.enabled}
                  onChange={(e) => wakeLock.setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 accent-[#2F6B4F]"
                />
                <Sun
                  className={`h-4 w-4 ${
                    wakeLock.isActive ? 'text-amber-500' : 'text-stone-400'
                  }`}
                />
                <span>防止螢幕休眠</span>
              </label>
            ) : (
              <span className="text-[11px] text-stone-400">
                需於 HTTPS 環境啟用螢幕常亮
              </span>
            )}
          </div>
        </div>

        {/* Modal 捲動內容區 */}
        <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {/* 缺料採買清單 */}
          {recipe.missingKeyIngredients.length > 0 && (
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <div className="font-bold">需補買的關鍵食材</div>
                  <p className="mt-0.5 text-amber-800">
                    {recipe.missingKeyIngredients.join('、')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyMissing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-2xs ring-1 ring-amber-300 transition hover:bg-amber-100"
              >
                {copiedMissing ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#2F6B4F]" />
                    <span>已複製清單</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>複製缺料採買清單</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 巨量營養素估算 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-stone-500">每份熱量</div>
                <div className="text-base font-bold text-stone-900">
                  {recipe.nutrition.calories} kcal
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500">蛋白質</div>
                <div className="text-base font-bold text-[#2F6B4F]">
                  {recipe.nutrition.proteinGrams}g
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500">碳水化合物</div>
                <div className="text-base font-bold text-stone-800">
                  {recipe.nutrition.carbsGrams}g
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500">脂肪</div>
                <div className="text-base font-bold text-stone-800">
                  {recipe.nutrition.fatGrams}g
                </div>
              </div>
            </div>
            <p className="mt-2.5 border-t border-stone-100 pt-2 text-center text-[11px] text-stone-400">
              ※ 營養素為 AI 依未秤重食材粗略估算，僅供參考
            </p>
          </div>

          {/* 食材與調味料雙欄 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900">
                <Utensils className="h-4 w-4 text-[#C84B31]" />
                <span>準備食材</span>
              </h3>
              <ul className="space-y-2 text-sm">
                {recipe.usedIngredients.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between border-b border-stone-100 pb-1.5 last:border-b-0 last:pb-0"
                  >
                    <span className="font-medium text-stone-800">{item.name}</span>
                    <span className="font-semibold text-stone-600">{item.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900">
                <Sparkles className="h-4 w-4 text-[#2F6B4F]" />
                <span>調味料比例</span>
              </h3>
              {recipe.usedSeasonings.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {recipe.usedSeasonings.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between border-b border-stone-100 pb-1.5 last:border-b-0 last:pb-0"
                    >
                      <span className="font-medium text-stone-800">{item.name}</span>
                      <span className="font-semibold text-[#2F6B4F]">{item.amount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-500">
                  本道料理僅使用食材原味，無須額外調味。
                </p>
              )}
            </div>
          </div>

          {/* 烹調步驟 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                烹調步驟（點擊可勾選進度）
              </h3>
              <span className="text-xs font-semibold text-[#2F6B4F]">
                已完成 {completedCount} / {totalSteps} 步
              </span>
            </div>

            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-[#2F6B4F] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <ol className="space-y-3">
              {recipe.steps.map((stepText, idx) => {
                const isDone = !!checkedSteps[idx];
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => toggleStep(idx)}
                      className={`flex w-full items-start gap-3.5 rounded-xl border p-3.5 text-left transition ${
                        isDone
                          ? 'border-[#2F6B4F]/30 bg-[#EBF5F0]/60'
                          : 'border-stone-200 bg-[#FAF8F5] hover:border-stone-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                          isDone
                            ? 'border-[#2F6B4F] bg-[#2F6B4F] text-white'
                            : 'border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
                      </span>
                      <span
                        className={`text-base leading-relaxed transition ${
                          isDone
                            ? 'text-stone-400 line-through'
                            : 'font-medium text-stone-800'
                        }`}
                      >
                        {stepText}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {recipe.tips && (
            <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">料理關鍵技巧</h4>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {recipe.tips}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
