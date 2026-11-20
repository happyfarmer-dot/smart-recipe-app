import React, { useState } from 'react';
import {
  X,
  PackageCheck,
  Check,
  AlertTriangle,
  Copy,
  Plus,
  Search,
} from 'lucide-react';
import type { SeasoningInventoryMeta } from '../types';
import { DEFAULT_SEASONING_GROUPS } from '../constants/seasonings';

interface PantryModalProps {
  isOpen: boolean;
  selectedSeasonings: string[];
  customSeasonings: string[];
  seasoningMeta: Record<string, SeasoningInventoryMeta>;
  onToggleSeasoning: (name: string) => void;
  onAddCustomSeasoning: (name: string) => void;
  onUpdateMeta: (name: string, meta: SeasoningInventoryMeta) => void;
  onClose: () => void;
}

export const PantryModal: React.FC<PantryModalProps> = ({
  isOpen,
  selectedSeasonings,
  customSeasonings,
  seasoningMeta,
  onToggleSeasoning,
  onAddCustomSeasoning,
  onUpdateMeta,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [copiedRestock, setCopiedRestock] = useState(false);

  if (!isOpen) return null;

  const allGroups = [
    ...DEFAULT_SEASONING_GROUPS,
    ...(customSeasonings.length > 0
      ? [
          {
            id: 'custom' as const,
            label: '自訂調味料',
            description: '您手動新增的調味料',
            items: customSeasonings,
          },
        ]
      : []),
  ];

  const lowStockItems = selectedSeasonings.filter(
    (name) => seasoningMeta[name]?.stockStatus === '快用完'
  );

  const handleCopyRestock = async () => {
    if (lowStockItems.length === 0) return;
    const text = `【調味料補貨清單】\n${lowStockItems
      .map((name) => {
        const note = seasoningMeta[name]?.note?.trim();
        return note ? `- ${name}（備註：${note}）` : `- ${name}`;
      })
      .join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRestock(true);
      setTimeout(() => setCopiedRestock(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onAddCustomSeasoning(trimmed);
    setCustomInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pantry-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#FAF8F5] shadow-2xl sm:rounded-3xl">
        {/* 頂部列 */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF5F0] text-[#2F6B4F]">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="pantry-modal-title"
                className="text-lg font-bold text-stone-900"
              >
                櫥櫃調味料庫存系統
              </h2>
              <p className="text-xs text-stone-500">
                已備妥 {selectedSeasonings.length} 項・快用完 {lowStockItems.length} 項（與料理步驟即時同步）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="關閉調味料櫥櫃"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 搜尋與篩選列 */}
        <div className="space-y-2.5 border-b border-stone-200 bg-white px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜尋調味料或備註..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C84B31] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyLowStock((prev) => !prev)}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                onlyLowStock
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>僅看快用完 ({lowStockItems.length})</span>
            </button>

            {lowStockItems.length > 0 && (
              <button
                type="button"
                onClick={handleCopyRestock}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
              >
                {copiedRestock ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>已複製補貨清單</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>複製補貨清單</span>
                  </>
                )}
              </button>
            )}
          </div>

          <form onSubmit={handleAddCustom} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="新增調味料至櫥櫃（例如：味醂、花椒油、柴魚粉）"
              className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#C84B31] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="inline-flex items-center gap-1 rounded-xl bg-[#C84B31] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#B03E26] disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span>加入</span>
            </button>
          </form>
        </div>

        {/* 庫存清單 */}
        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {allGroups.map((group) => {
            const filteredItems = group.items.filter((item) => {
              const meta = seasoningMeta[item];
              const matchesSearch =
                !searchText.trim() ||
                item.toLowerCase().includes(searchText.toLowerCase()) ||
                (meta?.note || '')
                  .toLowerCase()
                  .includes(searchText.toLowerCase());
              const matchesLow =
                !onlyLowStock ||
                (selectedSeasonings.includes(item) &&
                  meta?.stockStatus === '快用完');
              return matchesSearch && matchesLow;
            });

            if (filteredItems.length === 0) return null;

            return (
              <div
                key={group.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs"
              >
                <h3 className="mb-3 text-sm font-bold text-stone-900">
                  {group.label}
                </h3>
                <div className="space-y-2.5">
                  {filteredItems.map((item) => {
                    const isSelected = selectedSeasonings.includes(item);
                    const meta: SeasoningInventoryMeta = seasoningMeta[item] || {
                      stockStatus: '充足',
                      note: '',
                    };
                    const isLow = meta.stockStatus === '快用完';

                    return (
                      <div
                        key={item}
                        className={`flex flex-col gap-2 rounded-xl border p-2.5 transition sm:flex-row sm:items-center sm:justify-between ${
                          isSelected
                            ? 'border-stone-200 bg-[#FAF8F5]'
                            : 'border-stone-100 bg-stone-50/50 opacity-75'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleSeasoning(item)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                              isSelected
                                ? 'border-[#C84B31] bg-[#C84B31] text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            )}
                          </span>
                          <span className="text-sm font-semibold text-stone-900">
                            {item}
                          </span>
                        </button>

                        {isSelected && (
                          <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateMeta(item, {
                                  ...meta,
                                  stockStatus: isLow ? '充足' : '快用完',
                                })
                              }
                              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                isLow
                                  ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                                  : 'bg-[#EBF5F0] text-[#2F6B4F]'
                              }`}
                            >
                              {isLow ? '快用完' : '充足'}
                            </button>
                            <input
                              type="text"
                              value={meta.note}
                              onChange={(e) =>
                                onUpdateMeta(item, {
                                  ...meta,
                                  note: e.target.value,
                                })
                              }
                              placeholder="備註（如：剩半瓶）"
                              className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#C84B31] focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
