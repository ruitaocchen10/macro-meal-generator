// components/MealSnackSelector.tsx
import React from 'react';
import { Utensils, Coffee, ChevronDown, ChevronUp } from 'lucide-react';
import { Filters, generateMealStructure } from '../types';

interface MealSnackSelectorProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}

const MealSnackSelector: React.FC<MealSnackSelectorProps> = ({ 
  filters, 
  setFilters, 
  showFilters, 
  setShowFilters 
}) => {
  const handleMealCountChange = (count: number) => {
    setFilters(prev => ({ 
      ...prev, 
      mealConfiguration: {
        ...prev.mealConfiguration,
        mealCount: count
      }
    }));
  };

  const handleSnackCountChange = (count: number) => {
    setFilters(prev => ({ 
      ...prev, 
      mealConfiguration: {
        ...prev.mealConfiguration,
        snackCount: count
      }
    }));
  };

  const currentMealCount = filters.mealConfiguration.mealCount;
  const currentSnackCount = filters.mealConfiguration.snackCount;
  const totalItems = currentMealCount + currentSnackCount;

  // Generate preview structure
  const previewStructure = generateMealStructure(currentMealCount, currentSnackCount);

  const getSummaryText = () => {
    let text = `${currentMealCount} meal${currentMealCount !== 1 ? 's' : ''}`;
    if (currentSnackCount > 0) {
      text += ` + ${currentSnackCount} snack${currentSnackCount !== 1 ? 's' : ''}`;
    }
    return text;
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily Meal Structure</h2>
              <p className="text-slate-600 text-sm">
                {getSummaryText()} • {totalItems} total items
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            {showFilters ? (
              <>Hide <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Customize <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {/* Quick Preview when collapsed */}
        {!showFilters && (
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {previewStructure.mealTypes.slice(0, 6).map((item, index) => (
                <span 
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.category === 'meal' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {item.category === 'meal' ? '🍽️' : '🥨'} {item.name}
                </span>
              ))}
              {previewStructure.mealTypes.length > 6 && (
                <span className="text-xs text-slate-500">+{previewStructure.mealTypes.length - 6} more</span>
              )}
            </div>
          </div>
        )}
        
        {showFilters && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            {/* Meal Count Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <Utensils className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Number of Main Meals (1-6)</h3>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleMealCountChange(count)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      currentMealCount === count
                        ? 'border-emerald-400 bg-emerald-100 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-xl font-bold mb-1 ${
                        currentMealCount === count ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {count}
                      </div>
                      <div className="text-xs text-slate-600">
                        meal{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-emerald-700 text-sm">
                  <strong>🍽️ Main Meals:</strong> Complete recipes with 3-5 ingredients, full cooking instructions
                </p>
              </div>
            </div>

            {/* Snack Count Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <Coffee className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-slate-900">Number of Snacks (0-6)</h3>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleSnackCountChange(count)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      currentSnackCount === count
                        ? 'border-orange-400 bg-orange-100 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-xl font-bold mb-1 ${
                        currentSnackCount === count ? 'text-orange-600' : 'text-slate-900'
                      }`}>
                        {count}
                      </div>
                      <div className="text-xs text-slate-600">
                        snack{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-orange-700 text-sm">
                  <strong>🥨 Snacks:</strong> Simple 1-3 ingredient options, quick preparation (under 5 minutes)
                </p>
              </div>
            </div>

            {/* Preview Structure */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📅</span>
                Your Daily Structure ({totalItems} items)
              </h4>
              
              {totalItems > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {previewStructure.mealTypes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${item.category === 'meal' ? '🍽️' : '🥨'}`}></span>
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{item.name}</div>
                          <div className="text-xs text-slate-500 capitalize">
                            {item.category} • {item.caloriePercentage}% calories
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500">Select meals and snacks above to see your daily structure</p>
                </div>
              )}
            </div>

            {/* Calorie Distribution Info */}
            {totalItems > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-2">📊 Smart Calorie Distribution</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <p><strong>Meals:</strong> ~75% of daily calories</p>
                    <p>Each meal: ~{Math.round(75 / currentMealCount)}% of daily calories</p>
                  </div>
                  <div>
                    <p><strong>Snacks:</strong> ~25% of daily calories</p>
                    {currentSnackCount > 0 && (
                      <p>Each snack: ~{Math.round(25 / currentSnackCount)}% of daily calories</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dietary Restrictions */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  Dietary Restrictions
                </span>
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 pr-10 bg-white rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 text-slate-900 font-medium hover:border-slate-300 appearance-none"
                  value={filters.dietary}
                  onChange={(e) => setFilters(prev => ({ ...prev, dietary: e.target.value }))}
                >
                  <option value="all">No Restrictions</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten-Free</option>
                  <option value="dairy-free">Dairy-Free</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Items Warning */}
            {totalItems > 8 && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-800 text-sm">
                  <strong>⚠️ Note:</strong> {totalItems} items is quite a lot! Consider if this fits your lifestyle and eating schedule.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealSnackSelector;