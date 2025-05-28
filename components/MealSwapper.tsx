// components/MealSwapper.tsx
import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import { Meal, MacroGoals, Filters } from '../types';
import { generateMeals } from '../utils/smartMealGenerator';

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
      // Generate multiple meal plans and extract meals of the same type
      const allAlternatives: Meal[] = [];
      
      // Generate 3 different meal plans to get variety
      for (let i = 0; i < 3; i++) {
        const newMeals = generateMeals(macroGoals, filters, favoriteFoods);
        const sameMealType = newMeals.find(meal => meal.type === currentMeal.type);
        if (sameMealType && sameMealType.name !== currentMeal.name) {
          allAlternatives.push({
            ...sameMealType,
            id: Date.now() + i // Unique ID for alternatives
          });
        }
      }
      
      // Remove duplicates by name and limit to 3 alternatives
      const uniqueAlternatives = allAlternatives
        .filter((meal, index, arr) => 
          arr.findIndex(m => m.name === meal.name) === index
        )
        .slice(0, 3);
      
      setAlternatives(uniqueAlternatives);
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
      {/* Swap Button */}
      <button
        onClick={handleShowAlternatives}
        className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium"
      >
        <Shuffle className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
        Swap Meal
        {showAlternatives ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Alternatives Dropdown */}
      {showAlternatives && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">Alternative {currentMeal.type}s</h4>
            <button
              onClick={generateAlternatives}
              disabled={isLoading}
              className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-2">Finding alternatives...</p>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alternatives.map((alternative, index) => {
                const diff = getMacroDifference(alternative);
                return (
                  <button
                    key={index}
                    onClick={() => handleSwapMeal(alternative)}
                    className="w-full text-left p-3 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-slate-900 group-hover:text-indigo-900">
                        {alternative.name}
                      </h5>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        Swap
                      </span>
                    </div>

                    {/* Macro Comparison */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
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
                    <div className="mt-2 text-xs text-slate-600">
                      <span className="font-medium">Key ingredients:</span> {' '}
                      {alternative.ingredients.slice(0, 3).map(ing => ing.item).join(', ')}
                      {alternative.ingredients.length > 3 && '...'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">No alternatives found. Try refreshing.</p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              💡 <strong>Smart tip:</strong> Swapping will automatically rebalance your other meals to maintain daily macro targets
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealSwapper;