import React, { useEffect } from 'react';
import { X, Bookmark, Clock, ChefHat, Trash2, ChevronRight } from 'lucide-react';
import type { Recipe } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  favorites: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onRemoveFavorite: (recipe: Recipe) => void;
  onClose: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  favorites,
  onSelectRecipe,
  onRemoveFavorite,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorites-modal-title"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-[#FAF8F5] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-[#D95D39]" />
            <h2 id="favorites-modal-title" className="text-lg font-bold text-stone-900">
              已收藏食譜（{favorites.length}）
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
            aria-label="關閉已收藏清單"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
              <Bookmark className="mx-auto mb-3 h-10 w-10 text-stone-300" />
              <p className="text-base font-semibold text-stone-700">還沒有收藏任何食譜</p>
              <p className="mt-1 text-sm text-stone-500">
                在生成的食譜卡片或詳情頁點擊書籤圖示，即可將喜愛的料理永久保存於此。
              </p>
            </div>
          ) : (
            favorites.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs transition-colors hover:border-[#D95D39]/40"
              >
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectRecipe(recipe);
                  }}
                  className="flex-1 text-left"
                >
                  <h3 className="font-bold text-stone-900 hover:text-[#D95D39]">
                    {recipe.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      約 {recipe.cookTimeMinutes} 分鐘
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ChefHat className="h-3.5 w-3.5" />
                      {recipe.difficulty}
                    </span>
                    <span>{recipe.usedIngredients.length} 項食材</span>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(recipe)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`移除收藏 ${recipe.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectRecipe(recipe);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700 hover:bg-[#D95D39] hover:text-white"
                    aria-label={`查看 ${recipe.title}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
