import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  KeyRound,
  Cpu,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { AppSettings, GeminiModelOption } from '../types';
import { DEFAULT_MODEL_NAME } from '../constants/seasonings';
import { hasEnvApiKey, listModels } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelName, setModelName] = useState(
    settings.modelName || DEFAULT_MODEL_NAME
  );
  const [showKey, setShowKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const [availableModels, setAvailableModels] = useState<GeminiModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsSuccessMsg, setModelsSuccessMsg] = useState<string | null>(null);

  const envKeyPresent = hasEnvApiKey();

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.apiKey);
      setModelName(settings.modelName || DEFAULT_MODEL_NAME);
      setSavedNotice(false);
      setModelsError(null);
      setModelsSuccessMsg(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleFetchModels = async () => {
    const keyToUse =
      apiKey.trim() ||
      (typeof import.meta.env.VITE_GEMINI_API_KEY === 'string'
        ? import.meta.env.VITE_GEMINI_API_KEY.trim()
        : '');

    if (!keyToUse) {
      setModelsError('請先輸入 Gemini API Key 再進行驗證。');
      return;
    }

    setIsLoadingModels(true);
    setModelsError(null);
    setModelsSuccessMsg(null);

    try {
      const { models, recommendedModelId } = await listModels(keyToUse);
      setAvailableModels(models);

      // 若目前沒有模型或不在清單內，自動選取推薦的 flash 模型
      const currentExists = models.some((m) => m.id === modelName.trim());
      if (!currentExists && recommendedModelId) {
        setModelName(recommendedModelId);
      }

      setModelsSuccessMsg(
        `驗證成功！已載入 ${models.length} 個可用模型（預設推薦：${recommendedModelId}）。`
      );
    } catch (err) {
      setModelsError(
        err instanceof Error ? err.message : '驗證失敗，無法取得可用模型清單。'
      );
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiKey: apiKey.trim(),
      modelName: modelName.trim() || DEFAULT_MODEL_NAME,
    });
    setSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleClearKey = () => {
    setApiKey('');
    setAvailableModels([]);
    setModelsSuccessMsg(null);
    onSave({
      apiKey: '',
      modelName: modelName.trim() || DEFAULT_MODEL_NAME,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="text-lg font-bold text-stone-900"
              >
                系統與 AI 模型設定
              </h2>
              <p className="text-xs text-stone-500">
                BYOK 模式：金鑰與模型設定皆儲存於瀏覽器 localStorage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="關閉設定"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* API Key 輸入區 */}
          <div>
            <label
              htmlFor="gemini-api-key-input"
              className="mb-1.5 flex items-center justify-between text-sm font-semibold text-stone-800"
            >
              <span>Gemini API Key</span>
              {envKeyPresent && !apiKey && (
                <span className="rounded-full bg-[#EBF5F0] px-2.5 py-0.5 text-xs font-medium text-[#2F6B4F]">
                  已偵測到 .env 環境變數
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="gemini-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  envKeyPresent
                    ? '已使用 .env 金鑰（輸入此欄可覆蓋）'
                    : '請輸入 AIzaSy... 開頭的 Gemini API Key'
                }
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-3 pr-20 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C84B31] focus:bg-white focus:ring-2 focus:ring-[#C84B31]/20 focus:outline-none"
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                    title="清除儲存的金鑰"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
                  aria-label={showKey ? '隱藏金鑰' : '顯示金鑰'}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isLoadingModels}
                id="verify-load-models-btn"
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-[#C84B31]/40 bg-[#C84B31]/10 px-4 py-2 text-sm font-semibold text-[#C84B31] transition hover:bg-[#C84B31]/15 disabled:opacity-60"
              >
                {isLoadingModels ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>正在驗證金鑰並載入可用模型...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>驗證並載入可用模型</span>
                  </>
                )}
              </button>
            </div>

            {modelsError && (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{modelsError}</span>
              </div>
            )}

            {modelsSuccessMsg && (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-[#EBF5F0] p-3 text-xs text-[#2F6B4F]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{modelsSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* 動態模型選擇 + 手動覆寫 */}
          <div>
            <label
              htmlFor="gemini-model-input"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-stone-800"
            >
              <Cpu className="h-4 w-4 text-stone-500" />
              <span>AI 模型選擇與手動覆寫</span>
            </label>

            {availableModels.length > 0 && (
              <select
                value={
                  availableModels.some((m) => m.id === modelName)
                    ? modelName
                    : 'custom'
                }
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setModelName(e.target.value);
                  }
                }}
                id="dynamic-model-select"
                className="mb-2.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#C84B31] focus:bg-white focus:ring-2 focus:ring-[#C84B31]/20 focus:outline-none"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.id})
                  </option>
                ))}
                <option value="custom">手動輸入其他模型 ID...</option>
              </select>
            )}

            <input
              id="gemini-model-input"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="例如：gemini-2.5-flash"
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C84B31] focus:ring-2 focus:ring-[#C84B31]/20 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-stone-500">
              建議點擊上方「驗證並載入可用模型」自動偵測您的帳號支援的模型，或直接手動輸入模型 ID。
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              取消
            </button>
            <button
              type="submit"
              id="save-settings-btn"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#C84B31] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B03E26]"
            >
              {savedNotice ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>已儲存</span>
                </>
              ) : (
                <span>儲存設定</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
