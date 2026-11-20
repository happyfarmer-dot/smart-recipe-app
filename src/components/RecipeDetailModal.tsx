import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  ChefHat,
  Bookmark,
  Check,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  Utensils,
  Droplets,
} from 'lucide-react';
import type { Recipe } from '../types';

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

  useEffect(() => {
    setCheckedSteps({});
  }, [recipe?.id]);

  useEffect(() => {
    if (!recipe) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recipe, onClose]);

  if (!recipe) return null;

  const totalSteps = recipe.steps.length;
  const completedCount = Object.values(checkedSteps).filter(Boolean).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
    >
      <div
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#FAF8F5] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                符合度 {recipe.matchScore}%
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
                <Clock className="h-3.5 w-3.5" />
                約 {recipe.cookTimeMinutes} 分鐘
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
                <ChefHat className="h-3.5 w-3.5" />
                {recipe.difficulty}
              </span>
            </div>
            <h2 id="recipe-modal-title" className="text-xl font-bold text-stone-900">
              {recipe.title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(recipe)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                isFavorite
                  ? 'border-[#D95D39] bg-[#D95D39] text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? '已收藏' : '收藏食譜'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              aria-label="關閉食譜詳情"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {/* Missing Optional Notice */}
          {recipe.missingOptional.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold">缺少但建議搭配（可省略）：</span>
                <span>{recipe.missingOptional.join('、')}</span>
              </div>
            </div>
          )}

          {/* Ingredients & Seasonings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900">
                <Utensils className="h-4 w-4 text-[#D95D39]" />
                準備食材
              </h3>
              <ul className="space-y-2 text-sm">
                {recipe.usedIngredients.map((ing, idx) => (
                  <li
                    key={`${ing.name}-${idx}`}
                    className="flex items-center justify-between border-b border-stone-100 pb-1.5 last:border-none last:pb-0"
                  >
                    <span className="font-medium text-stone-800">{ing.name}</span>
                    <span className="font-semibold text-stone-600">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900">
                <Droplets className="h-4 w-4 text-[#D95D39]" />
                調味料比例
              </h3>
              {recipe.usedSeasonings.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {recipe.usedSeasonings.map((seas, idx) => (
                    <li
                      key={`${seas.name}-${idx}`}
                      className="flex items-center justify-between border-b border-stone-100 pb-1.5 last:border-none last:pb-0"
                    >
                      <span className="font-medium text-stone-800">{seas.name}</span>
                      <span className="font-semibold text-[#B84322]">{seas.amount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-stone-500">無需額外調味料，享受食材原味。</p>
              )}
            </div>
          </div>

          {/* Interactive Cooking Steps */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-stone-900">料理步驟（點擊可打勾記錄進度）</h3>
                <p className="text-xs text-stone-500">
                  已完成 {completedCount} / {totalSteps} 步驟
                </p>
              </div>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setCheckedSteps({})}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                >
                  <RotateCcw className="h-3 w-3" />
                  重設進度
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <ol className="space-y-2.5">
              {recipe.steps.map((stepText, idx) => {
                const isDone = Boolean(checkedSteps[idx]);
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => toggleStep(idx)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/60 text-stone-500'
                          : 'border-stone-200 bg-stone-50/50 text-stone-900 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${
                          isDone
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-stone-300 bg-white text-stone-600'
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                      </span>
                      <span
                        className={`text-sm leading-relaxed sm:text-base ${
                          isDone ? 'line-through decoration-stone-400' : 'font-medium'
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

          {/* Chef Tips */}
          {recipe.tips && (
            <div className="rounded-2xl border border-orange-200/80 bg-orange-50/70 p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-[#9A3412]">
                <Lightbulb className="h-4 w-4" />
                主廚料理小撇步
              </h3>
              <p className="text-sm leading-relaxed text-stone-700">{recipe.tips}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
