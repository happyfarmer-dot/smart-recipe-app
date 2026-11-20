import React, { useState, useEffect } from 'react';
import { X, KeyRound, Eye, EyeOff, Cpu, Check, Trash2, Info } from 'lucide-react';
import type { AppSettings } from '../types';
import { DEFAULT_MODEL_NAME, MODEL_PRESETS } from '../constants/seasonings';
import { hasEnvApiKey } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelName, setModelName] = useState(settings.modelName || DEFAULT_MODEL_NAME);
  const [showKey, setShowKey] = useState(false);

  const envAvailable = hasEnvApiKey();

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey);
      setModelName(settings.modelName || DEFAULT_MODEL_NAME);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiKey: apiKey.trim(),
      modelName: modelName.trim() || DEFAULT_MODEL_NAME,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 id="settings-modal-title" className="text-lg font-bold text-stone-900">
            AI 模型與 API Key 設定
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
            aria-label="關閉設定"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* BYOK API Key */}
          <div className="space-y-2">
            <label
              htmlFor="gemini-api-key"
              className="flex items-center gap-1.5 text-sm font-bold text-stone-800"
            >
              <KeyRound className="h-4 w-4 text-[#D95D39]" />
              Gemini API Key（BYOK 模式）
            </label>
            <div className="relative">
              <input
                id="gemini-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="貼上您的 AIza... API Key"
                className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 pl-3.5 pr-20 text-sm text-stone-900 focus:border-[#D95D39] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D95D39]/20"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setApiKey('')}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                    title="清除 API Key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200"
                  aria-label={showKey ? '隱藏 API Key' : '顯示 API Key'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
              <div className="space-y-1">
                <p>API Key 僅儲存於您的瀏覽器 localStorage，不會傳送至任何第三方伺服器。</p>
                {envAvailable && (
                  <p className="font-semibold text-emerald-700">
                    ✓ 已偵測到環境變數 VITE_GEMINI_API_KEY，若此欄留空將自動使用環境變數。
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label
              htmlFor="gemini-model-name"
              className="flex items-center gap-1.5 text-sm font-bold text-stone-800"
            >
              <Cpu className="h-4 w-4 text-[#D95D39]" />
              Gemini 模型選擇
            </label>

            <div className="space-y-1.5">
              {MODEL_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setModelName(preset.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                    modelName === preset.value
                      ? 'border-[#D95D39] bg-[#D95D39]/5 text-[#9A3412]'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{preset.label}</span>
                  {modelName === preset.value && <Check className="h-4 w-4 text-[#D95D39]" />}
                </button>
              ))}
            </div>

            <input
              id="gemini-model-name"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="自訂模型名稱（例如：gemini-2.5-flash）"
              className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs text-stone-800 focus:border-[#D95D39] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#D95D39] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-[#C24D2B]"
            >
              儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
