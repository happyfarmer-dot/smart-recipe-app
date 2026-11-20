import { useCallback, useMemo, useState } from 'react';
import { Camera, Heart, PackageCheck, Settings, WifiOff } from 'lucide-react';
import type {
  AppSettings,
  AppStep,
  CompressedImage,
  IngredientItem,
  MainTab,
  Recipe,
  RecipeFilters,
  SeasoningInventoryMeta,
} from './types';
import {
  DEFAULT_MODEL_NAME,
  DEFAULT_SELECTED_SEASONINGS,
} from './constants/seasonings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  generateDualTrackRecipes,
  getEffectiveApiKey,
  recognizeIngredientsFromImages,
} from './services/gemini';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { Stage1Ingredients } from './components/Stage1Ingredients';
import { Stage2Seasonings } from './components/Stage2Seasonings';
import { Stage3Recipes } from './components/Stage3Recipes';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { FavoritesModal } from './components/FavoritesModal';
import { PantryModal } from './components/PantryModal';

const STORAGE_KEYS = {
  SETTINGS: 'fridge_wizard_settings_v1',
  SEASONINGS: 'fridge_wizard_seasonings_v1',
  CUSTOM_SEASONINGS: 'fridge_wizard_custom_seasonings_v1',
  FAVORITES: 'fridge_wizard_favorites_v2',
};

export function App() {
  const isOnline = useOnlineStatus();

  // Persistent state in localStorage
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    STORAGE_KEYS.SETTINGS,
    {
      apiKey: '',
      modelName: DEFAULT_MODEL_NAME,
    }
  );
  const [selectedSeasonings, setSelectedSeasonings] = useLocalStorage<string[]>(
    STORAGE_KEYS.SEASONINGS,
    DEFAULT_SELECTED_SEASONINGS
  );
  const [customSeasonings, setCustomSeasonings] = useLocalStorage<string[]>(
    STORAGE_KEYS.CUSTOM_SEASONINGS,
    []
  );
  const [favorites, setFavorites] = useLocalStorage<Recipe[]>(
    STORAGE_KEYS.FAVORITES,
    []
  );
  const [seasoningMeta, setSeasoningMeta] = useLocalStorage<
    Record<string, SeasoningInventoryMeta>
  >('fridge_wizard_seasoning_meta_v1', {});

  // Navigation & workflow state
  const [activeTab, setActiveTab] = useState<MainTab>('cook');
  const [currentStep, setCurrentStep] = useState<AppStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<AppStep>(1);

  const [images, setImages] = useState<CompressedImage[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const [filters, setFilters] = useState<RecipeFilters>({
    servings: '2人',
    maxTime: '30分鐘內',
    equipment: '不限',
    dietaryGoal: '不限',
    enableUnlockMode: true,
  });

  const [readyRecipes, setReadyRecipes] = useState<Recipe[]>([]);
  const [unlockableRecipes, setUnlockableRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Modals state
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [isPantryOpen, setIsPantryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  const effectiveApiKey = getEffectiveApiKey(settings.apiKey);
  const hasApiKey = Boolean(effectiveApiKey);

  const favoriteIds = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach((f) => {
      set.add(f.id);
      set.add(f.title);
    });
    return set;
  }, [favorites]);

  const isFavorite = useCallback(
    (recipe: Recipe) =>
      favoriteIds.has(recipe.id) || favoriteIds.has(recipe.title),
    [favoriteIds]
  );

  const navigateToStep = (step: AppStep) => {
    setActiveTab('cook');
    setCurrentStep(step);
    setMaxReachedStep((prev) => (step > prev ? step : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 1 handlers
  const handleAddImages = (newImages: CompressedImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
    setRecognitionError(null);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleRecognize = async () => {
    if (!isOnline) {
      setRecognitionError('目前處於離線狀態，無法進行 AI 食材辨識。');
      return;
    }
    setIsRecognizing(true);
    setRecognitionError(null);
    try {
      const detected = await recognizeIngredientsFromImages(
        images,
        effectiveApiKey,
        settings.modelName || DEFAULT_MODEL_NAME
      );
      setIngredients((prev) => {
        const manualOnes = prev.filter((i) => i.isManual);
        const mergedNames = new Set(detected.map((d) => d.name));
        const keptManual = manualOnes.filter((m) => !mergedNames.has(m.name));
        return [...detected, ...keptManual];
      });
    } catch (err) {
      setRecognitionError(
        err instanceof Error ? err.message : '食材辨識失敗，請稍後重試。'
      );
    } finally {
      setIsRecognizing(false);
    }
  };

  // Stage 2 handlers
  const handleAddCustomSeasoning = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomSeasonings((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setSelectedSeasonings((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
  };

  const handleRemoveCustomSeasoning = (name: string) => {
    setCustomSeasonings((prev) => prev.filter((item) => item !== name));
    setSelectedSeasonings((prev) => prev.filter((item) => item !== name));
  };

  // Stage 3 handlers
  const handleGenerateRecipes = async () => {
    navigateToStep(3);
    if (!isOnline) {
      setGenerationError('目前處於離線狀態，無法進行 AI 食譜生成。');
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const result = await generateDualTrackRecipes({
        ingredients,
        seasonings: selectedSeasonings,
        filters,
        apiKey: effectiveApiKey,
        modelName: settings.modelName || DEFAULT_MODEL_NAME,
      });
      setReadyRecipes(result.readyRecipes);
      setUnlockableRecipes(result.unlockableRecipes);
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : '生成食譜時發生錯誤，請重試。'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Favorites handlers
  const handleToggleFavorite = (recipe: Recipe) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (f) => f.id === recipe.id || f.title === recipe.title
      );
      if (exists) {
        return prev.filter(
          (f) => f.id !== recipe.id && f.title !== recipe.title
        );
      }
      return [{ ...recipe, createdAt: Date.now() }, ...prev];
    });
  };

  const handleResetToStart = () => {
    navigateToStep(1);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20 text-[#1C1917]">
      <Header
        hasApiKey={hasApiKey}
        favoritesCount={favorites.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onResetToStart={handleResetToStart}
      />

      <StepIndicator
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepClick={navigateToStep}
      />

      <main className="mx-auto max-w-4xl px-4 pt-3 pb-10 sm:px-6">
        {/* 離線狀態提示 */}
        {!isOnline && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-stone-300 bg-stone-800 px-4 py-3 text-sm text-white shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
              <span>
                目前為離線模式：AI 辨識與生成功能暫時停用，您仍可瀏覽「我的收藏」離線食譜。
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFavoritesOpen(true)}
              className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
            >
              查看收藏
            </button>
          </div>
        )}

        {/* API Key 提醒 */}
        {!hasApiKey && isOnline && (
          <div className="mb-4 flex flex-col justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center">
            <span>
              提醒：尚未設定 Gemini API Key，請先點擊設定填入您的金鑰以啟用 AI 辨識與食譜生成。
            </span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="shrink-0 self-start rounded-xl bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800 sm:self-auto"
            >
              立即設定
            </button>
          </div>
        )}

        {currentStep === 1 && (
          <Stage1Ingredients
            images={images}
            onAddImages={handleAddImages}
            onRemoveImage={handleRemoveImage}
            ingredients={ingredients}
            onUpdateIngredients={setIngredients}
            isRecognizing={isRecognizing}
            recognitionError={recognitionError}
            onRecognize={handleRecognize}
            onNextStep={() => navigateToStep(2)}
            hasApiKey={hasApiKey}
            isOnline={isOnline}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {currentStep === 2 && (
          <Stage2Seasonings
            selectedSeasonings={selectedSeasonings}
            onChangeSelectedSeasonings={setSelectedSeasonings}
            customSeasonings={customSeasonings}
            onAddCustomSeasoning={handleAddCustomSeasoning}
            onRemoveCustomSeasoning={handleRemoveCustomSeasoning}
            filters={filters}
            onChangeFilters={setFilters}
            ingredientCount={ingredients.length}
            isOnline={isOnline}
            onBack={() => navigateToStep(1)}
            onGenerateRecipes={handleGenerateRecipes}
          />
        )}

        {currentStep === 3 && (
          <Stage3Recipes
            readyRecipes={readyRecipes}
            unlockableRecipes={unlockableRecipes}
            isGenerating={isGenerating}
            generationError={generationError}
            filters={filters}
            isOnline={isOnline}
            onRegenerate={handleGenerateRecipes}
            onBackToSeasonings={() => navigateToStep(2)}
            onSelectRecipe={(recipe) => setActiveRecipe(recipe)}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* 手機優先底部導覽列 */}
      <nav
        aria-label="主導覽"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto grid max-w-4xl grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('cook');
              setIsPantryOpen(false);
              setIsFavoritesOpen(false);
              setIsSettingsOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold transition ${
              activeTab === 'cook' &&
              !isPantryOpen &&
              !isFavoritesOpen &&
              !isSettingsOpen
                ? 'text-[#C84B31]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Camera className="h-5 w-5" />
            <span>開始辨識</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pantry');
              setIsPantryOpen(true);
              setIsFavoritesOpen(false);
              setIsSettingsOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold transition ${
              isPantryOpen
                ? 'text-[#C84B31]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <PackageCheck className="h-5 w-5" />
            <span>調味料櫥櫃</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('favorites');
              setIsFavoritesOpen(true);
              setIsPantryOpen(false);
              setIsSettingsOpen(false);
            }}
            className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold transition ${
              isFavoritesOpen
                ? 'text-[#C84B31]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <div className="relative">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C84B31] px-1 text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </div>
            <span>我的收藏</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setIsSettingsOpen(true);
              setIsPantryOpen(false);
              setIsFavoritesOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold transition ${
              isSettingsOpen
                ? 'text-[#C84B31]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>設定</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <PantryModal
        isOpen={isPantryOpen}
        selectedSeasonings={selectedSeasonings}
        customSeasonings={customSeasonings}
        seasoningMeta={seasoningMeta}
        onToggleSeasoning={(name) =>
          setSelectedSeasonings((prev) =>
            prev.includes(name)
              ? prev.filter((s) => s !== name)
              : [...prev, name]
          )
        }
        onAddCustomSeasoning={handleAddCustomSeasoning}
        onUpdateMeta={(name, meta) =>
          setSeasoningMeta((prev) => ({ ...prev, [name]: meta }))
        }
        onClose={() => {
          setIsPantryOpen(false);
          setActiveTab('cook');
        }}
      />

      <RecipeDetailModal
        recipe={activeRecipe}
        isFavorite={activeRecipe ? isFavorite(activeRecipe) : false}
        onClose={() => setActiveRecipe(null)}
        onToggleFavorite={handleToggleFavorite}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => {
          setIsSettingsOpen(false);
          setActiveTab('cook');
        }}
        onSave={setSettings}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        favorites={favorites}
        onClose={() => {
          setIsFavoritesOpen(false);
          setActiveTab('cook');
        }}
        onSelectRecipe={(recipe) => setActiveRecipe(recipe)}
        onRemoveFavorite={handleToggleFavorite}
      />
    </div>
  );
}

export default App;
