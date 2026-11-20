import React from 'react';
import { ChefHat, Bookmark, Settings } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  favoritesCount: number;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
  onResetToStart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  favoritesCount,
  onOpenSettings,
  onOpenFavorites,
  onResetToStart,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF8F5]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onResetToStart}
          className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D95D39] text-white shadow-sm">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-stone-900 sm:text-lg">
              冰箱魔法師
            </h1>
            <p className="text-xs text-stone-500">拍照辨識食材・智慧生成食譜</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFavorites}
            className="relative flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 active:scale-[0.98]"
            aria-label="已收藏食譜"
          >
            <Bookmark className="h-4 w-4 text-[#D95D39]" />
            <span className="hidden sm:inline">已收藏</span>
            {favoritesCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D95D39] px-1.5 text-xs font-semibold text-white">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="relative flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 active:scale-[0.98]"
            aria-label="設定"
          >
            <Settings className="h-4 w-4 text-stone-600" />
            <span className="hidden sm:inline">設定</span>
            {!hasApiKey && (
              <span
                className="absolute -right-1 -top-1 flex h-3 w-3"
                title="尚未設定 API Key"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
