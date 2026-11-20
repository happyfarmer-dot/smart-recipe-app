import React, { useState } from 'react';
import {
  Clock,
  ChefHat,
  Bookmark,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Settings,
  ChevronRight,
} from 'lucide-react';
import type {
  EquipmentOption,
  MaxTimeOption,
  Recipe,
  RecipeFilters,
  ServingsOption,
} from '../types';

interface Stage3RecipesProps {
  recipes: Recipe[];
  isGenerating: boolean;
  generationError: string | null;
  filters: RecipeFilters;
  onChangeFilters: (next: RecipeFilters) => void;
  onRegenerate: () => void;
  onBackToSeasonings: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  isFavorite: (recipe: Recipe) => boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  onOpenSettings: () => void;
  ingredientNames: string[];
  seasoningCount: number;
}

const SERVINGS_OPTIONS: ServingsOption[] = ['1人', '2人', '3-4人'];
const MAX_TIME_OPTIONS: MaxTimeOption[] = ['15分鐘內', '30分鐘內', '不限'];
const EQUIPMENT_OPTIONS: EquipmentOption[] = ['不限', '平底鍋', '電鍋', '氣炸鍋', '舒肥機'];

export const Stage3Recipes: React.FC<Stage3RecipesProps> = ({
  recipes,
  isGenerating,
  generationError,
  filters,
  onChangeFilters,
  onRegenerate,
  onBackToSeasonings,
  onSelectRecipe,
  isFavorite,
  onToggleFavorite,
  onOpenSettings,
  ingredientNames,
  seasoningCount,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const getDifficultyBadgeClass = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case '簡單':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200/70';
      case '中等':
        return 'bg-amber-50 text-amber-700 ring-amber-200/70';
      case '進階':
        return 'bg-rose-50 text-rose-700 ring-rose-200/70';
      default:
        return 'bg-stone-100 text-stone-700 ring-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Context & Collapsible Re-filter Bar */}
      <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-stone-900">AI 智慧推薦食譜</h2>
            <p className="text-xs text-stone-500 sm:text-sm">
              食材：{ingredientNames.slice(0, 5).join('、')}
              {ingredientNames.length > 5 ? ` 等 ${ingredientNames.length} 項` : ''} ・ 調味料：
              {seasoningCount} 項 ・ {filters.servings} / {filters.maxTime} / {filters.equipment}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>調整條件</span>
              {showFilters ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D95D39] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#C24D2B] disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>重新生成</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 border-t border-stone-200/80 bg-stone-50/50 p-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-500">份量</label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVINGS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onChangeFilters({ ...filters, servings: opt })}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        filters.servings === opt
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-500">時間上限</label>
                <div className="flex flex-wrap gap-1.5">
                  {MAX_TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onChangeFilters({ ...filters, maxTime: opt })}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        filters.maxTime === opt
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-500">烹調設備</label>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onChangeFilters({ ...filters, equipment: opt })}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        filters.equipment === opt
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  setShowFilters(false);
                  onRegenerate();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                套用條件並重新生成
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Loading Skeletons */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-orange-200/70 bg-orange-50/70 px-4 py-3 text-sm font-semibold text-[#B84322]">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>主廚正在為您搭配現有食材與調味料，設計零浪費食譜中...</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="animate-pulse space-y-3 rounded-2xl border border-stone-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 rounded-full bg-stone-200" />
                  <div className="h-6 w-6 rounded-full bg-stone-200" />
                </div>
                <div className="h-6 w-3/4 rounded-lg bg-stone-200" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-md bg-stone-100" />
                  <div className="h-5 w-14 rounded-md bg-stone-100" />
                </div>
                <div className="h-12 w-full rounded-xl bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {generationError && !isGenerating && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1 space-y-2">
              <p className="text-base font-bold">無法生成食譜</p>
              <p className="text-sm text-red-700">{generationError}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  再試一次
                </button>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  <Settings className="h-3.5 w-3.5" />
                  檢查 API 設定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Cards Grid */}
      {!isGenerating && !generationError && recipes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => {
            const fav = isFavorite(recipe);
            const isFullMatch =
              recipe.missingOptional.length === 0 && recipe.matchScore >= 95;

            return (
              <article
                key={recipe.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs transition-all hover:border-[#D95D39]/50 hover:shadow-md"
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        isFullMatch
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                      }`}
                    >
                      {isFullMatch && <CheckCircle2 className="h-3.5 w-3.5" />}
                      符合度 {recipe.matchScore}%
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(recipe);
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                        fav
                          ? 'border-[#D95D39]/30 bg-[#D95D39]/10 text-[#D95D39]'
                          : 'border-stone-200 bg-stone-50 text-stone-400 hover:text-stone-700'
                      }`}
                      aria-label={fav ? '取消收藏食譜' : '收藏此食譜'}
                    >
                      <Bookmark className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Recipe Title & Meta */}
                  <button
                    type="button"
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-full text-left"
                  >
                    <h3 className="text-lg font-bold text-stone-900 transition-colors group-hover:text-[#D95D39]">
                      {recipe.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-600">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1">
                        <Clock className="h-3.5 w-3.5 text-stone-500" />
                        約 {recipe.cookTimeMinutes} 分鐘
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ring-1 ${getDifficultyBadgeClass(
                          recipe.difficulty
                        )}`}
                      >
                        <ChefHat className="h-3.5 w-3.5" />
                        {recipe.difficulty}
                      </span>
                    </div>

                    {/* Ingredients Summary */}
                    <div className="mt-3.5 space-y-1.5 text-sm text-stone-600">
                      <p className="line-clamp-2">
                        <span className="font-semibold text-stone-800">使用食材：</span>
                        {recipe.usedIngredients.map((i) => i.name).join('、')}
                      </p>
                      {recipe.missingOptional.length > 0 && (
                        <p className="text-xs font-medium text-amber-700">
                          缺少但建議搭配（可省略）：{recipe.missingOptional.join('、')}
                        </p>
                      )}
                    </div>
                  </button>
                </div>

                {/* Card Footer CTA */}
                <button
                  type="button"
                  onClick={() => onSelectRecipe(recipe)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors group-hover:bg-[#D95D39]/10 group-hover:text-[#B84322]"
                >
                  <span>查看完整步驟與比例</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="flex justify-start pt-1">
        <button
          type="button"
          onClick={onBackToSeasonings}
          className="flex min-h-[46px] items-center gap-2 rounded-2xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回調整調味料與條件</span>
        </button>
      </div>
    </div>
  );
};
