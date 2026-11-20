import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Heart,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  ShoppingBag,
} from 'lucide-react';
import type { Recipe, RecipeFilters } from '../types';

interface Stage3RecipesProps {
  readyRecipes: Recipe[];
  unlockableRecipes: Recipe[];
  isGenerating: boolean;
  generationError: string | null;
  filters: RecipeFilters;
  isOnline: boolean;
  onRegenerate: () => void;
  onBackToSeasonings: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  isFavorite: (recipe: Recipe) => boolean;
  onToggleFavorite: (recipe: Recipe) => void;
  onOpenSettings: () => void;
}

export const Stage3Recipes: React.FC<Stage3RecipesProps> = ({
  readyRecipes,
  unlockableRecipes,
  isGenerating,
  generationError,
  filters,
  isOnline,
  onRegenerate,
  onBackToSeasonings,
  onSelectRecipe,
  isFavorite,
  onToggleFavorite,
  onOpenSettings,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyShoppingList = async (
    e: React.MouseEvent,
    recipe: Recipe
  ) => {
    e.stopPropagation();
    const text = `【${recipe.title}】缺料採買清單：\n${recipe.missingKeyIngredients
      .map((item) => `- ${item}`)
      .join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(recipe.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const renderRecipeCard = (recipe: Recipe) => {
    const fav = isFavorite(recipe);
    const isUnlockable = recipe.category === 'unlockable';

    return (
      <article
        key={recipe.id}
        className="group relative flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-xs transition hover:border-[#C84B31]/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectRecipe(recipe)}
            className="flex-1 text-left"
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isUnlockable
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-[#EBF5F0] text-[#2F6B4F]'
                }`}
              >
                {isUnlockable ? (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>差 {recipe.missingKeyIngredients.length} 樣解鎖</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>100% 現有食材可做</span>
                  </>
                )}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                <Clock className="h-3.5 w-3.5 text-stone-500" />
                {recipe.cookTimeMinutes} 分鐘
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                <Flame className="h-3.5 w-3.5 text-[#C84B31]" />
                {recipe.difficulty}
              </span>

              {recipe.dietaryTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h4 className="text-lg font-bold text-stone-900 transition-colors group-hover:text-[#C84B31] sm:text-xl">
              {recipe.title}
            </h4>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(recipe)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#C84B31]"
            aria-label={fav ? `取消收藏 ${recipe.title}` : `收藏 ${recipe.title}`}
            title={fav ? '取消收藏' : '收藏此食譜'}
          >
            <Heart
              className={`h-5 w-5 ${fav ? 'fill-[#C84B31] text-[#C84B31]' : ''}`}
            />
          </button>
        </div>

        {/* 巨量營養素摘要 */}
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-[#FAF8F5] px-3 py-2 text-center text-xs">
          <div>
            <div className="text-stone-500">熱量</div>
            <div className="font-bold text-stone-900">
              {recipe.nutrition.calories} kcal
            </div>
          </div>
          <div>
            <div className="text-stone-500">蛋白質</div>
            <div className="font-bold text-[#2F6B4F]">
              {recipe.nutrition.proteinGrams}g
            </div>
          </div>
          <div>
            <div className="text-stone-500">碳水</div>
            <div className="font-bold text-stone-800">
              {recipe.nutrition.carbsGrams}g
            </div>
          </div>
          <div>
            <div className="text-stone-500">脂肪</div>
            <div className="font-bold text-stone-800">
              {recipe.nutrition.fatGrams}g
            </div>
          </div>
        </div>

        {/* 缺料提示與一鍵複製採買清單 */}
        {isUnlockable && recipe.missingKeyIngredients.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
            <span>
              <strong className="font-bold">需補買：</strong>
              {recipe.missingKeyIngredients.join('、')}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopyShoppingList(e, recipe)}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-amber-900 shadow-2xs ring-1 ring-amber-300 transition hover:bg-amber-100"
            >
              {copiedId === recipe.id ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#2F6B4F]" />
                  <span>已複製</span>
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

        <button
          type="button"
          onClick={() => onSelectRecipe(recipe)}
          className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-sm font-semibold text-[#C84B31]"
        >
          <span>查看完整步驟與料理專注模式</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </article>
    );
  };

  const hasAnyRecipes =
    readyRecipes.length > 0 || unlockableRecipes.length > 0;

  return (
    <section className="space-y-5" aria-label="階段三：雙軌食譜推薦">
      {/* 頂部控制列 */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            步驟三：為您推薦的智慧食譜
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {filters.servings}・時間{filters.maxTime}・設備{filters.equipment}
            ・目標：{filters.dietaryGoal}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBackToSeasonings}
            disabled={isGenerating}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>調整調味料與條件</span>
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating || !isOnline}
            id="regenerate-recipes-btn"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`}
            />
            <span>{isOnline ? '重新生成食譜' : '離線中'}</span>
          </button>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {generationError && !isGenerating && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-rose-900">食譜生成失敗</h3>
              <p className="mt-1 text-sm leading-relaxed text-rose-800">
                {generationError}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={onRegenerate}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>重試生成</span>
                </button>
                {(generationError.includes('API Key') ||
                  generationError.includes('404') ||
                  generationError.includes('模型')) && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
                  >
                    <span>前往設定切換模型</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 生成中 Skeleton */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-medium text-amber-900">
            <Sparkles className="h-4 w-4 animate-pulse text-[#C84B31]" />
            <span>
              AI 主廚正在為您調配「立即可做」與「差 1–2 樣解鎖」雙軌食譜並估算營養素...
            </span>
          </div>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 rounded-lg bg-stone-200" />
                <div className="h-6 w-20 rounded-full bg-stone-200" />
              </div>
              <div className="mt-3 h-12 w-full rounded-xl bg-stone-100" />
              <div className="mt-4 h-4 w-2/3 rounded bg-stone-100" />
            </div>
          ))}
        </div>
      )}

      {/* 雙軌結果區 */}
      {!isGenerating && !generationError && hasAnyRecipes && (
        <div className="space-y-6">
          <p className="text-xs text-stone-500">
            ※ 營養素為 AI 依未秤重食材粗略估算，僅供參考
          </p>

          {readyRecipes.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-stone-900">
                <CheckCircle2 className="h-5 w-5 text-[#2F6B4F]" />
                <span>現有食材立即可做（{readyRecipes.length} 道）</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {readyRecipes.map(renderRecipeCard)}
              </div>
            </div>
          )}

          {unlockableRecipes.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-stone-900">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                <span>
                  差 1–2 樣即可解鎖的進階食譜（{unlockableRecipes.length} 道）
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {unlockableRecipes.map(renderRecipeCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
