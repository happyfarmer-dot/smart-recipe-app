import { useCallback, useMemo, useState } from 'react';
import type {
  AppSettings,
  AppStep,
  CompressedImage,
  IngredientItem,
  Recipe,
  RecipeFilters,
} from './types';
import {
  DEFAULT_MODEL_NAME,
  DEFAULT_SELECTED_SEASONINGS,
} from './constants/seasonings';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  generateRecipes,
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

const STORAGE_KEYS = {
  SETTINGS: 'fridge_wizard_settings_v1',
  SEASONINGS: 'fridge_wizard_seasonings_v1',
  CUSTOM_SEASONINGS: 'fridge_wizard_custom_seasonings_v1',
  FAVORITES: 'fridge_wizard_favorites_v1',
};

export function App() {
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

  // Ephemeral workflow state
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
  });

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Modals state
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
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
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const generated = await generateRecipes({
        ingredients,
        seasonings: selectedSeasonings,
        filters,
        apiKey: effectiveApiKey,
        modelName: settings.modelName || DEFAULT_MODEL_NAME,
      });
      setRecipes(generated);
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917]">
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

      <main className="mx-auto max-w-4xl px-4 pt-3 pb-16 sm:px-6">
        {!hasApiKey && (
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
            onBack={() => navigateToStep(1)}
            onGenerateRecipes={handleGenerateRecipes}
          />
        )}

        {currentStep === 3 && (
          <Stage3Recipes
            recipes={recipes}
            isGenerating={isGenerating}
            generationError={generationError}
            filters={filters}
            onChangeFilters={setFilters}
            onRegenerate={handleGenerateRecipes}
            onBackToSeasonings={() => navigateToStep(2)}
            onSelectRecipe={(recipe) => setActiveRecipe(recipe)}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onOpenSettings={() => setIsSettingsOpen(true)}
            ingredientNames={ingredients.map((i) => i.name)}
            seasoningCount={selectedSeasonings.length}
          />
        )}
      </main>

      {/* Modals */}
      <RecipeDetailModal
        recipe={activeRecipe}
        isFavorite={activeRecipe ? isFavorite(activeRecipe) : false}
        onClose={() => setActiveRecipe(null)}
        onToggleFavorite={handleToggleFavorite}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        favorites={favorites}
        onClose={() => setIsFavoritesOpen(false)}
        onSelectRecipe={(recipe) => setActiveRecipe(recipe)}
        onRemoveFavorite={handleToggleFavorite}
      />
    </div>
  );
}

export default App;
