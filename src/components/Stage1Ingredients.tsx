import React, { useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Trash2,
  Sparkles,
  Plus,
  X,
  Pencil,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
  RotateCcw,
  Settings,
} from 'lucide-react';
import type { CompressedImage, IngredientItem } from '../types';
import { compressImageFile, formatBytes } from '../utils/imageCompressor';

interface Stage1IngredientsProps {
  images: CompressedImage[];
  onAddImages: (newImages: CompressedImage[]) => void;
  onRemoveImage: (id: string) => void;
  ingredients: IngredientItem[];
  onUpdateIngredients: (items: IngredientItem[]) => void;
  isRecognizing: boolean;
  recognitionError: string | null;
  onRecognize: () => void;
  onNextStep: () => void;
  hasApiKey: boolean;
  isOnline: boolean;
  onOpenSettings: () => void;
}

export const Stage1Ingredients: React.FC<Stage1IngredientsProps> = ({
  images,
  onAddImages,
  onRemoveImage,
  ingredients,
  onUpdateIngredients,
  isRecognizing,
  recognitionError,
  onRecognize,
  onNextStep,
  hasApiKey,
  isOnline,
  onOpenSettings,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);

  const [manualName, setManualName] = useState('');
  const [manualStatus, setManualStatus] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsCompressing(true);
    setCompressError(null);

    const files = Array.from(fileList);
    const compressed: CompressedImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const result = await compressImageFile(file);
        compressed.push(result);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `無法處理檔案「${file.name}」`);
      }
    }

    if (compressed.length > 0) {
      onAddImages(compressed);
    }
    if (errors.length > 0) {
      setCompressError(errors.join('；'));
    }

    setIsCompressing(false);
    // Reset input values so selecting the same file again still triggers onChange
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (albumInputRef.current) albumInputRef.current.value = '';
  };

  const handleAddManualIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualName.trim();
    if (!trimmed) return;

    const newItem: IngredientItem = {
      id: `ing_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      status: manualStatus.trim() || '適量',
      isManual: true,
    };

    onUpdateIngredients([...ingredients, newItem]);
    setManualName('');
    setManualStatus('');
  };

  const handleDeleteIngredient = (id: string) => {
    onUpdateIngredients(ingredients.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditing = (item: IngredientItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditStatus(item.status);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      handleDeleteIngredient(editingId);
      return;
    }
    onUpdateIngredients(
      ingredients.map((item) =>
        item.id === editingId
          ? { ...item, name: trimmedName, status: editStatus.trim() || '適量' }
          : item
      )
    );
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Photo Capture & Upload */}
      <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">1. 拍攝或上傳食材照片</h2>
            <p className="text-sm text-stone-500">
              支援多張照片分次追加，系統會自動壓縮至 1024px 以節省流量與加速辨識。
            </p>
          </div>
          {images.length > 0 && (
            <span className="inline-flex w-fit items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              已上傳 {images.length} 張照片
            </span>
          )}
        </div>

        {/* Hidden Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* Dual Entry Buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isCompressing || isRecognizing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl border-2 border-[#D95D39]/25 bg-[#D95D39]/5 px-4 py-3 text-base font-semibold text-[#B84322] transition-all hover:border-[#D95D39]/50 hover:bg-[#D95D39]/10 active:scale-[0.99] disabled:opacity-50"
          >
            <Camera className="h-5 w-5" />
            <span>開啟相機拍照</span>
          </button>

          <button
            type="button"
            disabled={isCompressing || isRecognizing}
            onClick={() => albumInputRef.current?.click()}
            className="flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-base font-semibold text-stone-800 transition-all hover:border-stone-300 hover:bg-stone-100 active:scale-[0.99] disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5 text-stone-600" />
            <span>從相簿選擇照片</span>
          </button>
        </div>

        {/* Compression Feedback */}
        {isCompressing && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>正在壓縮與最佳化照片畫質...</span>
          </div>
        )}

        {compressError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{compressError}</span>
          </div>
        )}

        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.fileName}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    disabled={isRecognizing}
                    aria-label={`移除照片 ${img.fileName}`}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900/75 text-white shadow-sm backdrop-blur-xs transition-colors hover:bg-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="bg-stone-900/70 px-2.5 py-1.5 text-[11px] text-white backdrop-blur-xs">
                    <div className="truncate font-medium">
                      {img.width}×{img.height}
                    </div>
                    <div className="text-stone-300">
                      {formatBytes(img.compressedSize)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recognize CTA */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {!hasApiKey && (
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>尚未設定 Gemini API Key，請先至設定填入後方可辨識。</span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="font-semibold underline hover:text-amber-900"
                  >
                    前往設定
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={isRecognizing || isCompressing || !isOnline}
                onClick={onRecognize}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#D95D39] px-6 py-3 text-base font-bold text-white shadow-sm transition-all hover:bg-[#C24D2B] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI 正在辨識食材中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>{ingredients.length > 0 ? '重新辨識照片食材' : '開始 AI 辨識食材'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Recognition Loading Skeleton */}
      {isRecognizing && (
        <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
            <Loader2 className="h-4 w-4 animate-spin text-[#D95D39]" />
            <span>正在分析照片中的食材與估計份量...</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-10 w-28 animate-pulse rounded-full bg-stone-200/80"
              />
            ))}
          </div>
        </section>
      )}

      {/* Recognition Error Banner */}
      {recognitionError && !isRecognizing && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold">食材辨識遇到問題</p>
              <p className="text-sm text-red-700">{recognitionError}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={onRecognize}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重新辨識
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Settings className="h-3.5 w-3.5" />
                  檢查 API 設定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Interactive Ingredient Confirmation Chips */}
      <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-stone-900">2. 確認與校正食材清單</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              共 {ingredients.length} 項食材
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            點擊標籤可修改名稱或狀態，點擊 × 可刪除誤判食材；也可直接手動新增漏掉的食材。
          </p>
        </div>

        {/* Ingredient Chips List */}
        {ingredients.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2.5">
            {ingredients.map((item) => {
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-1.5 rounded-xl border-2 border-[#D95D39] bg-orange-50/50 p-1.5"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      placeholder="食材名稱"
                      className="w-28 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-sm font-medium text-stone-900 focus:border-[#D95D39] focus:outline-none"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      placeholder="狀態/份量"
                      className="w-24 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-sm text-stone-700 focus:border-[#D95D39] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      aria-label="儲存修改"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-200 text-stone-600 hover:bg-stone-300"
                      aria-label="取消修改"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-3.5 pr-2 text-sm shadow-2xs transition-colors hover:border-stone-300 hover:bg-stone-100"
                >
                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    className="flex items-center gap-1.5 text-left"
                    title="點擊編輯食材"
                  >
                    <span className="font-semibold text-stone-900">{item.name}</span>
                    {item.status && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-stone-500 ring-1 ring-stone-200/70">
                        {item.status}
                      </span>
                    )}
                    <Pencil className="h-3 w-3 text-stone-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteIngredient(item.id)}
                    className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    aria-label={`刪除 ${item.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-6 text-center text-sm text-stone-500">
            尚未有任何食材。請先上方拍照辨識，或在下方手動輸入現有食材。
          </div>
        )}

        {/* Manual Add Ingredient Form */}
        <form onSubmit={handleAddManualIngredient} className="flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="手動新增食材（例如：雞蛋、豆腐、青江菜）"
            className="min-h-[44px] flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95D39] focus:outline-none focus:ring-2 focus:ring-[#D95D39]/20"
          />
          <input
            type="text"
            value={manualStatus}
            onChange={(e) => setManualStatus(e.target.value)}
            placeholder="份量/狀態（選填，如：3顆）"
            className="min-h-[44px] w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95D39] focus:outline-none focus:ring-2 focus:ring-[#D95D39]/20 sm:w-44"
          />
          <button
            type="submit"
            disabled={!manualName.trim()}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            <span>新增食材</span>
          </button>
        </form>
      </section>

      {/* Bottom Action Bar */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          disabled={ingredients.length === 0 || isRecognizing}
          onClick={onNextStep}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#D95D39] px-8 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-[#C24D2B] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none sm:w-auto"
        >
          <span>確認食材無誤，下一步選擇調味料</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
