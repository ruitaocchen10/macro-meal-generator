import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { foodDatabase, Food, getFoodsByCategory, getTrustIndicator, getConfidenceDisplay } from '../utils/foodDatabase';
import NutritionTrustIndicators from './NutritionTrustIndicators';

interface FoodPreferencesProps {
  selectedFoods: string[];
  onFoodsChange: (foodIds: string[]) => void;
  showPreferences: boolean;
  setShowPreferences: React.Dispatch<React.SetStateAction<boolean>>;
}

const FoodPreferences: React.FC<FoodPreferencesProps> = ({
  selectedFoods,
  onFoodsChange,
  showPreferences,
  setShowPreferences
}) => {
  const [activeCategory, setActiveCategory] = useState<'proteins' | 'carbs' | 'fats' | 'vegetables'>('proteins');

  const categories = [
    { key: 'proteins' as const, label: 'Proteins', icon: '🥩', gradient: 'from-red-500 to-pink-600' },
    { key: 'carbs' as const, label: 'Carbs', icon: '🍞', gradient: 'from-green-500 to-emerald-600' },
    { key: 'fats' as const, label: 'Fats', icon: '🥑', gradient: 'from-yellow-500 to-orange-600' },
    { key: 'vegetables' as const, label: 'Vegetables', icon: '🥬', gradient: 'from-green-400 to-teal-600' }
  ];

  const toggleFood = (foodId: string) => {
    if (selectedFoods.includes(foodId)) {
      onFoodsChange(selectedFoods.filter(id => id !== foodId));
    } else {
      onFoodsChange([...selectedFoods, foodId]);
    }
  };

  const categoryFoods = getFoodsByCategory(activeCategory);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Food Preferences</h2>
              {selectedFoods.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-slate-600 text-sm">Personalizing with your favorites</p>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
                    {selectedFoods.length} selected
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            {showPreferences ? (
              <>Hide <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Select Favorites <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {!showPreferences && selectedFoods.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
            <p className="text-rose-800 font-medium text-sm">
              ✨ Using your {selectedFoods.length} favorite foods to create personalized meals
            </p>
          </div>
        )}

        {showPreferences && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <p className="text-blue-800 font-medium text-sm">
                💡 Select your favorite foods and we'll prioritize them when creating your meal plans
              </p>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`group relative p-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 ${
                    activeCategory === category.key
                      ? 'bg-white shadow-lg border-2 border-slate-300'
                      : 'bg-slate-50 hover:bg-white border-2 border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <span className={`text-sm ${
                      activeCategory === category.key ? 'text-slate-900' : 'text-slate-600'
                    }`}>
                      {category.label}
                    </span>
                  </div>
                  {activeCategory === category.key && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              {categoryFoods.map((food) => {
                const isSelected = selectedFoods.includes(food.id);
                return (
                  <button
                    key={food.id}
                    onClick={() => toggleFood(food.id)}
                    className={`group text-left p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      isSelected
                        ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{food.name}</h4>
                          <NutritionTrustIndicators food={food} size="small" />
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                          <span className="font-medium">{food.calsPerServing} cal</span> per {food.serving}
                        </p>
                        <div className="flex gap-2 text-xs mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                            P: {food.protein}g
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                            C: {food.carbs}g
                          </span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">
                            F: {food.fat}g
                          </span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? 'bg-rose-500 shadow-lg scale-110' 
                          : 'bg-slate-100 group-hover:bg-rose-100'
                      }`}>
                        <Heart 
                          className={`h-4 w-4 transition-all duration-300 ${
                            isSelected ? 'text-white fill-current' : 'text-slate-400 group-hover:text-rose-500'
                          }`} 
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedFoods.length > 0 && (
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500 fill-current" />
                  Your Selected Favorites ({selectedFoods.length}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFoods.map((foodId) => {
                    const food = foodDatabase.find(f => f.id === foodId);
                    if (!food) return null;
                    return (
                      <span
                        key={foodId}
                        className="group inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-800 text-xs font-medium px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors"
                      >
                        {food.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFood(foodId);
                          }}
                          className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full p-1 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodPreferences;