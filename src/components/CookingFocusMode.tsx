import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sun,
  Lightbulb,
  Timer,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import type { Recipe } from '../types';

interface CookingFocusModeProps {
  recipe: Recipe;
  wakeLockActive: boolean;
  onExit: () => void;
}

interface StepDuration {
  label: string;
  seconds: number;
}

/**
 * 從步驟文字中擷取所有時間（支援 小時 / 分鐘 / 分 / 秒），回傳不重複的時間選項
 */
function extractStepDurations(text: string): StepDuration[] {
  const regex = /(\d+(?:\.\d+)?)\s*(?:個)?(小時|分鐘|分|秒鐘|秒)/g;
  const results: StepDuration[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    if (Number.isNaN(value) || value <= 0) continue;

    const unit = match[2];
    let seconds = 0;
    if (unit === '小時') seconds = Math.round(value * 3600);
    else if (unit === '分鐘' || unit === '分') seconds = Math.round(value * 60);
    else if (unit === '秒鐘' || unit === '秒') seconds = Math.round(value);

    const label = `${match[1]} ${unit}`;
    if (seconds > 0 && !seen.has(label)) {
      seen.add(label);
      results.push({ label, seconds });
    }
  }
  return results;
}

function formatCountdown(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function playTimerChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      gain.gain.setValueAtTime(0.25, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.5);
    });
  } catch {
    // Silent fallback
  }
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

  const currentStepText = recipe.steps[stepIndex] || '';
  const durations = useMemo(
    () => extractStepDurations(currentStepText),
    [currentStepText]
  );

  const [selectedDurationIdx, setSelectedDurationIdx] = useState(0);
  const activeDuration = durations[selectedDurationIdx] ?? durations[0] ?? null;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // 切換步驟時重設計時器
  useEffect(() => {
    setSelectedDurationIdx(0);
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(durations[0]?.seconds ?? 0);
  }, [stepIndex, durations]);

  const handleSelectDuration = (idx: number) => {
    setSelectedDurationIdx(idx);
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(durations[idx]?.seconds ?? 0);
  };

  // 倒數計時迴圈
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          setIsFinished(true);
          playTimerChime();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([250, 120, 250]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  const handleToggleTimer = () => {
    if (isFinished && activeDuration) {
      setRemainingSeconds(activeDuration.seconds);
      setIsFinished(false);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setRemainingSeconds(activeDuration?.seconds ?? 0);
  };

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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center overflow-y-auto px-5 py-6 sm:px-8">
        <div className="rounded-3xl border border-stone-800 bg-stone-900/90 p-6 shadow-2xl sm:p-10">
          <div className="mb-4 inline-flex h-10 items-center rounded-full bg-[#C84B31] px-4 text-base font-bold text-white">
            第 {stepIndex + 1} 步
          </div>
          <p className="text-2xl leading-relaxed font-bold tracking-wide text-white sm:text-3xl sm:leading-relaxed">
            {currentStepText}
          </p>

          {/* 步驟倒數計時器（偵測到時間時自動顯示） */}
          {activeDuration !== null && (
            <div
              className={`mt-6 space-y-3 rounded-2xl border p-4 transition ${
                isFinished
                  ? 'border-emerald-500/60 bg-emerald-950/60'
                  : isRunning
                  ? 'border-amber-500/50 bg-amber-950/40'
                  : 'border-stone-700 bg-stone-800/80'
              }`}
            >
              {durations.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-stone-400">
                    選擇計時：
                  </span>
                  {durations.map((d, idx) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => handleSelectDuration(idx)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        selectedDurationIdx === idx
                          ? 'bg-[#C84B31] text-white'
                          : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isFinished
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-700 text-amber-300'
                    }`}
                  >
                    <Timer className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-400">
                      {isFinished ? '⏰ 倒數時間到！' : '步驟倒數計時'}
                    </div>
                    <div className="font-mono text-3xl font-bold tracking-wider text-white">
                      {formatCountdown(remainingSeconds)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    id="focus-timer-toggle-btn"
                    className={`inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold text-white shadow-sm transition active:scale-[0.98] ${
                      isRunning
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-[#C84B31] hover:bg-[#B03E26]'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5" />
                        <span>暫停</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        <span>{isFinished ? '再計時一次' : '開始倒數'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    id="focus-timer-reset-btn"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-stone-600 bg-stone-800 px-3.5 text-stone-200 transition hover:bg-stone-700"
                    aria-label="重設倒數計時"
                    title="重設"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

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
