import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  X,
  CheckCheck,
} from 'lucide-react';
import {
  BASIC_SEASONING_ITEMS,
  DEFAULT_SEASONING_GROUPS,
} from '../constants/seasonings';
import type {
  EquipmentOption,
  MaxTimeOption,
  RecipeFilters,
  ServingsOption,
} from '../types';

interface Stage2SeasoningsProps {
  selectedSeasonings: string[];
  onChangeSelectedSeasonings: (next: string[]) => void;
  customSeasonings: string[];
  onAddCustomSeasoning: (name: string) => void;
  onRemoveCustomSeasoning: (name: string) => void;
  filters: RecipeFilters;
  onChangeFilters: (next: RecipeFilters) => void;
  ingredientCount: number;
  onBack: () => void;
  onGenerateRecipes: () => void;
}

const SERVINGS_OPTIONS: ServingsOption[] = ['1人', '2人', '3-4人'];
const MAX_TIME_OPTIONS: MaxTimeOption[] = ['15分鐘內', '30分鐘內', '不限'];
const EQUIPMENT_OPTIONS: EquipmentOption[] = ['不限', '平底鍋', '電鍋', '氣炸鍋', '舒肥機'];

export const Stage2Seasonings: React.FC<Stage2SeasoningsProps> = ({
  selectedSeasonings,
  onChangeSelectedSeasonings,
  customSeasonings,
  onAddCustomSeasoning,
  onRemoveCustomSeasoning,
  filters,
  onChangeFilters,
  ingredientCount,
  onBack,
  onGenerateRecipes,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    basic: true,
    chinese: true,
    aromatics: true,
    oils_flours: true,
    custom: true,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSeasoning = (name: string) => {
    if (selectedSeasonings.includes(name)) {
      onChangeSelectedSeasonings(selectedSeasonings.filter((item) => item !== name));
    } else {
      onChangeSelectedSeasonings([...selectedSeasonings, name]);
    }
  };

  const handleSelectAllBasic = () => {
    const merged = Array.from(new Set([...selectedSeasonings, ...BASIC_SEASONING_ITEMS]));
    onChangeSelectedSeasonings(merged);
    setExpandedGroups((prev) => ({ ...prev, basic: true }));
  };

  const handleClearAll = () => {
    onChangeSelectedSeasonings([]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onAddCustomSeasoning(trimmed);
    setCustomInput('');
    setExpandedGroups((prev) => ({ ...prev, custom: true }));
  };

  return (
    <div className="space-y-6">
      {/* Seasonings Selection Card */}
      <section className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">勾選手邊現有調味料</h2>
              <span className="rounded-full bg-[#D95D39]/10 px-2.5 py-0.5 text-xs font-bold text-[#B84322]">
                已選 {selectedSeasonings.length} 項
              </span>
            </div>
            <p className="mt-0.5 text-sm text-stone-500">
              系統會自動記住您的常用調味料，下次開啟無需重複勾選。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSelectAllBasic}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 active:scale-[0.98]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              一鍵全選基礎調味
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedSeasonings.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              清除全部
            </button>
          </div>
        </div>

        {/* Custom Seasoning Input */}
        <form onSubmit={handleCustomSubmit} className="mb-5 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="自訂新增調味料（例如：味醂、鰹魚粉、花椒油、柚子胡椒）"
            className="min-h-[44px] flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#D95D39] focus:outline-none focus:ring-2 focus:ring-[#D95D39]/20"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            <span>新增</span>
          </button>
        </form>

        {/* Categorized Seasoning Groups */}
        <div className="space-y-3">
          {customSeasonings.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40">
              <button
                type="button"
                onClick={() => toggleGroup('custom')}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-stone-100/70"
              >
                <div>
                  <span className="text-sm font-bold text-stone-900">我的自訂調味料</span>
                  <span className="ml-2 text-xs text-stone-500">
                    ({customSeasonings.filter((s) => selectedSeasonings.includes(s)).length}/
                    {customSeasonings.length})
                  </span>
                </div>
                {expandedGroups.custom ? (
                  <ChevronUp className="h-4 w-4 text-stone-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-stone-500" />
                )}
              </button>
              {expandedGroups.custom && (
                <div className="flex flex-wrap gap-2 border-t border-stone-200/70 bg-white p-3.5">
                  {customSeasonings.map((item) => {
                    const isSelected = selectedSeasonings.includes(item);
                    return (
                      <div
                        key={item}
                        className={`inline-flex items-center rounded-full border text-sm transition-all ${
                          isSelected
                            ? 'border-[#D95D39] bg-[#D95D39] text-white shadow-2xs'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSeasoning(item)}
                          className="flex items-center gap-1.5 py-2 pl-3.5 pr-2 font-medium"
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          <span>{item}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveCustomSeasoning(item)}
                          className={`mr-1.5 flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                            isSelected
                              ? 'text-white/80 hover:bg-white/20 hover:text-white'
                              : 'text-stone-400 hover:bg-red-100 hover:text-red-600'
                          }`}
                          aria-label={`從自訂清單移除 ${item}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {DEFAULT_SEASONING_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.id] ?? true;
            const selectedCountInGroup = group.items.filter((item) =>
              selectedSeasonings.includes(item)
            ).length;

            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-stone-100/70"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900">{group.label}</span>
                      <span className="text-xs font-medium text-stone-500">
                        ({selectedCountInGroup}/{group.items.length})
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{group.description}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-stone-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="flex flex-wrap gap-2 border-t border-stone-200/70 bg-white p-3.5">
                    {group.items.map((item) => {
                      const isSelected = selectedSeasonings.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleSeasoning(item)}
                          className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-[0.97] ${
                            isSelected
                              ? 'border-[#D95D39] bg-[#D95D39] text-white shadow-2xs'
                              : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Collapsible Recipe Filter Conditions */}
      <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs">
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-stone-50 sm:px-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 sm:text-base">
                料理條件過濾（選填）
              </h3>
              <p className="text-xs text-stone-500">
                目前設定：{filters.servings} ・ {filters.maxTime} ・ 設備：{filters.equipment}
              </p>
            </div>
          </div>
          {showFilters ? (
            <ChevronUp className="h-5 w-5 text-stone-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-500" />
          )}
        </button>

        {showFilters && (
          <div className="space-y-4 border-t border-stone-200/80 p-4 sm:px-6 sm:pb-6">
            {/* Servings */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                預計份量
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVINGS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, servings: opt })}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      filters.servings === opt
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Time */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                料理時間上限
              </label>
              <div className="flex flex-wrap gap-2">
                {MAX_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, maxTime: opt })}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      filters.maxTime === opt
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                烹調設備偏好
              </label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, equipment: opt })}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      filters.equipment === opt
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Action Bar */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回修改食材（{ingredientCount} 項）</span>
        </button>

        <button
          type="button"
          onClick={onGenerateRecipes}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#D95D39] px-8 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-[#C24D2B] active:scale-[0.99]"
        >
          <Sparkles className="h-5 w-5" />
          <span>AI 生成專屬食譜</span>
        </button>
      </div>
    </div>
  );
};
