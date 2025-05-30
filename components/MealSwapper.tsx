// components/MealSwapper.tsx (AI-Only Version)
import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Shuffle, ThumbsDown, Zap } from 'lucide-react';
import { Meal, MacroGoals, Filters } from '../types';
import { generateAIMeals } from '../utils/aiMealGenerator';

interface MealSwapperProps {
  currentMeal: Meal;
  mealIndex: number;
  macroGoals: MacroGoals;
  filters: Filters;
  favoriteFoods: string[];
  onMealSwap: (mealIndex: number, newMeal: Meal) => void;
}

const MealSwapper: React.FC<MealSwapperProps> = ({
  currentMeal,
  mealIndex,
  macroGoals,
  filters,
  favoriteFoods,
  onMealSwap
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateAlternatives = async () => {
    setIsLoading(true);
    
    try {
      console.log('🤖 Generating AI alternatives...');
      const allAlternatives: Meal[] = [];
      
      // Generate multiple AI meal plans to get variety
      for (let i = 0; i < 4; i++) {
        try {
          const newMeals = await generateAIMeals(macroGoals, filters, favoriteFoods);
          const sameMealType = newMeals.find(meal => 
            meal.type === currentMeal.type && meal.name !== currentMeal.name
          );
          if (sameMealType) {
            allAlternatives.push({
              ...sameMealType,
              id: Date.now() + i // Unique ID for alternatives
            });
          }
        } catch (error) {
          console.log(`AI generation attempt ${i + 1} failed:`, error);
        }
      }
      
      // Remove duplicates by name and limit to 3 alternatives
      const uniqueAlternatives = allAlternatives
        .filter((meal, index, arr) => 
          arr.findIndex(m => m.name === meal.name) === index
        )
        .slice(0, 3);
      
      setAlternatives(uniqueAlternatives);
      
      if (uniqueAlternatives.length === 0) {
        console.log('No alternatives generated');
      }
    } catch (error) {
      console.error('Error generating alternatives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAlternatives = () => {
    if (!showAlternatives && alternatives.length === 0) {
      generateAlternatives();
    }
    setShowAlternatives(!showAlternatives);
  };

  const handleSwapMeal = (newMeal: Meal) => {
    onMealSwap(mealIndex, newMeal);
    setShowAlternatives(false);
  };

  const handleQuickReplace = async () => {
    setIsLoading(true);
    try {
      const newMeals = await generateAIMeals(macroGoals, filters, favoriteFoods);
      const replacement = newMeals.find(meal => 
        meal.type === currentMeal.type && meal.name !== currentMeal.name
      );
      
      if (replacement) {
        handleSwapMeal(replacement);
      } else {
        // If no same-type replacement, use first meal
        if (newMeals.length > 0) {
          handleSwapMeal(newMeals[0]);
        }
      }
    } catch (error) {
      console.error('Quick replace error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMacroDifference = (newMeal: Meal) => {
    return {
      calories: newMeal.calories - currentMeal.calories,
      protein: newMeal.protein - currentMeal.protein,
      carbs: newMeal.carbs - currentMeal.carbs,
      fat: newMeal.fat - currentMeal.fat
    };
  };

  const formatMacroDiff = (diff: number, unit: string = '') => {
    const sign = diff > 0 ? '+' : '';
    const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
    return (
      <span className={`${color} font-medium`}>
        {sign}{diff}{unit}
      </span>
    );
  };

  return (
    <div className="relative">
      {/* Main Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick "Don't Like" Button */}
        <button
          onClick={handleQuickReplace}
          disabled={isLoading}
          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-red-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
          ) : (
            <ThumbsDown className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
          {isLoading ? 'Generating...' : 'Don\'t Like'}
        </button>

        {/* Swap Options Button */}
        <button
          onClick={handleShowAlternatives}
          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium"
        >
          <Shuffle className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
          More Options
          {showAlternatives ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Alternatives Dropdown */}
      {showAlternatives && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10 animate-in slide-in-from-top duration-200 min-w-96">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">AI Alternative {currentMeal.type}s</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={generateAlternatives}
                disabled={isLoading}
                className="p-1 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                title="Refresh alternatives"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAlternatives(false)}
                className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-3">AI creating perfect alternatives...</p>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alternatives.map((alternative, index) => {
                const diff = getMacroDifference(alternative);
                return (
                  <button
                    key={index}
                    onClick={() => handleSwapMeal(alternative)}
                    className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900 group-hover:text-indigo-900 mb-1">
                          {alternative.name}
                        </h5>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                            <Zap className="h-3 w-3 inline mr-1" />
                            AI Generated
                          </span>
                          {alternative.dietary !== 'none' && alternative.dietary !== 'ai-generated' && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                              {alternative.dietary}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Macro Comparison */}
                    <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                      <div className="text-center">
                        <div className="font-medium text-slate-900">{alternative.calories}</div>
                        <div className="text-slate-500">cal</div>
                        <div>{formatMacroDiff(diff.calories)}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{alternative.protein}g</div>
                        <div className="text-slate-500">protein</div>
                        <div>{formatMacroDiff(diff.protein, 'g')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{alternative.carbs}g</div>
                        <div className="text-slate-500">carbs</div>
                        <div>{formatMacroDiff(diff.carbs, 'g')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-amber-600">{alternative.fat}g</div>
                        <div className="text-slate-500">fat</div>
                        <div>{formatMacroDiff(diff.fat, 'g')}</div>
                      </div>
                    </div>

                    {/* Ingredients Preview */}
                    <div className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100">
                      <span className="font-medium">Key ingredients:</span> {' '}
                      {alternative.ingredients.slice(0, 3).map(ing => ing.item).join(', ')}
                      {alternative.ingredients.length > 3 && '...'}
                    </div>

                    {/* Show AI-specific features if available */}
                    {(alternative as any).description && (
                      <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                        <span className="font-medium">AI Description:</span> {(alternative as any).description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Shuffle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">No AI alternatives found. Try refreshing for more options.</p>
              <button
                onClick={generateAlternatives}
                className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Generate AI Alternatives
              </button>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <strong>AI-Powered:</strong> All alternatives are freshly generated by AI to match your preferences
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealSwapper;