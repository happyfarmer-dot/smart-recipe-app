import React from 'react';
import { Check, Camera, Sparkles, UtensilsCrossed } from 'lucide-react';
import type { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
  maxReachedStep: AppStep;
  onStepClick: (step: AppStep) => void;
}

const STEPS: Array<{
  step: AppStep;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { step: 1, label: '食材辨識確認', shortLabel: '1. 確認食材', icon: Camera },
  { step: 2, label: '調味料與條件', shortLabel: '2. 調味料', icon: UtensilsCrossed },
  { step: 3, label: '智慧食譜推薦', shortLabel: '3. 選食譜', icon: Sparkles },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  maxReachedStep,
  onStepClick,
}) => {
  return (
    <nav aria-label="流程進度" className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-xs">
        {STEPS.map(({ step, label, shortLabel, icon: Icon }) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;
          const isClickable = step <= maxReachedStep;

          return (
            <button
              key={step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step)}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
                isActive
                  ? 'bg-[#D95D39] text-white shadow-xs'
                  : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : isClickable
                      ? 'text-stone-600 hover:bg-stone-100'
                      : 'cursor-not-allowed text-stone-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-500'
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className="truncate sm:hidden">{shortLabel}</span>
              <span className="hidden truncate sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
