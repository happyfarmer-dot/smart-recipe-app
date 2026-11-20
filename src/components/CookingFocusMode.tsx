import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sun,
  Lightbulb,
} from 'lucide-react';
import type { Recipe } from '../types';

interface CookingFocusModeProps {
  recipe: Recipe;
  wakeLockActive: boolean;
  onExit: () => void;
}

export const CookingFocusMode: React.FC<CookingFocusModeProps> = ({
  recipe,
  wakeLockActive,
  onExit,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const totalSteps = recipe.steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const progressPct =
    totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 100;

  const handleNext = () => {
    if (isLast) {
      onExit();
    } else {
      setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-stone-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="料理專注模式"
    >
      {/* 頂部導覽與進度條 */}
      <header className="border-b border-stone-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <span>料理專注模式</span>
              {wakeLockActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[11px] text-emerald-300 ring-1 ring-emerald-700/60">
                  <Sun className="h-3 w-3" />
                  螢幕常亮中
                </span>
              )}
            </div>
            <h2 className="mt-0.5 truncate text-lg font-bold text-white sm:text-xl">
              {recipe.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onExit}
            id="exit-focus-mode-btn"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-stone-800 px-3.5 py-2 text-sm font-semibold text-stone-200 transition hover:bg-stone-700"
          >
            <X className="h-5 w-5" />
            <span>離開</span>
          </button>
        </div>

        {/* 進度條 */}
        <div className="mx-auto mt-3 max-w-3xl">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-stone-300">
            <span>
              步驟 {stepIndex + 1} / {totalSteps}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full rounded-full bg-[#C84B31] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* 中央大字步驟區 */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center overflow-y-auto px-5 py-8 sm:px-8">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/90 p-6 shadow-2xl sm:p-10">
          <div className="mb-4 inline-flex h-10 items-center rounded-full bg-[#C84B31] px-4 text-base font-bold text-white">
            第 {stepIndex + 1} 步
          </div>
          <p className="text-2xl leading-relaxed font-bold tracking-wide text-white sm:text-3xl sm:leading-relaxed">
            {recipe.steps[stepIndex]}
          </p>

          {isLast && recipe.tips && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-amber-200">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="text-sm leading-relaxed sm:text-base">
                <span className="font-bold text-amber-300">主廚提醒：</span>
                {recipe.tips}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 底部超大觸控按鈕 */}
      <footer className="border-t border-stone-800 bg-stone-950 p-4 sm:p-6">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            disabled={isFirst}
            onClick={handlePrev}
            id="focus-prev-step-btn"
            className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border border-stone-700 bg-stone-900 px-4 text-lg font-bold text-stone-200 transition hover:bg-stone-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" />
            <span>上一步</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            id="focus-next-step-btn"
            className={`flex min-h-[64px] items-center justify-center gap-2 rounded-2xl px-4 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] ${
              isLast
                ? 'bg-[#2F6B4F] hover:bg-[#25573F]'
                : 'bg-[#C84B31] hover:bg-[#B03E26]'
            }`}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-6 w-6" />
                <span>完成料理</span>
              </>
            ) : (
              <>
                <span>下一步</span>
                <ChevronRight className="h-6 w-6" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
