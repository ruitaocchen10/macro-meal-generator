'use client';

import React, { useState, useEffect } from 'react';
import { MacroGoals, Filters, Meal, generateMealStructure } from '../types';
import { generateAIMeals } from '../utils/aiMealGenerator';
import MacroCalculator from '../components/MacroCalculator';
import MealSnackSelector from '../components/MealSnackSelector';
import TextPreferences from '../components/TextPreferences';
import MealGenerator from '../components/MealGenerator';
import MealSwapper from '../components/MealSwapper';
import { Target, Utensils, Sparkles, BarChart3, CheckCircle, Calendar } from 'lucide-react';

const MacroMealGenerator = () => {
  const [macroGoals, setMacroGoals] = useState<MacroGoals>({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  
  const [filters, setFilters] = useState<Filters>({
    mealConfiguration: {
      mealCount: 3,
      snackCount: 2
    },
    dietary: 'all',
    cookingTime: 'any' // Add this line
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);
  const [foodExclusions, setFoodExclusions] = useState<string[]>([]);
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [planInfo, setPlanInfo] = useState<{ totalMeals: number; routine: { name: string; description: string } } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [macrosCalculated, setMacrosCalculated] = useState(false);
  const [replacingMealIndex, setReplacingMealIndex] = useState<number | null>(null);

  // Helper functions
  const createPlanInfo = (macroGoals: MacroGoals, mealConfig: any) => {
    const totalItems = mealConfig.mealCount + mealConfig.snackCount;
    let description = `${mealConfig.mealCount} meal${mealConfig.mealCount !== 1 ? 's' : ''}`;
    if (mealConfig.snackCount > 0) {
      description += ` + ${mealConfig.snackCount} snack${mealConfig.snackCount !== 1 ? 's' : ''}`;
    }
    description += ' with optimized macro distribution';

    return {
      totalMeals: totalItems,
      routine: {
        name: `${totalItems}-Item Daily Structure`,
        description
      }
    };
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 4000);
  };

  // Load preferences and exclusions from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('food-preferences');
    if (savedPreferences) {
      setFoodPreferences(JSON.parse(savedPreferences));
    }

    const savedExclusions = localStorage.getItem('food-exclusions');
    if (savedExclusions) {
      setFoodExclusions(JSON.parse(savedExclusions));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('food-preferences', JSON.stringify(foodPreferences));
  }, [foodPreferences]);

  // Save exclusions to localStorage
  useEffect(() => {
    localStorage.setItem('food-exclusions', JSON.stringify(foodExclusions));
  }, [foodExclusions]);

  const handleMacrosCalculated = (calculatedMacros: MacroGoals) => {
    setMacroGoals(calculatedMacros);
    setMacrosCalculated(true);
    showSuccessMessage('Macros calculated! Ready to generate your meal plan 🎯');
  };

  const handleMealsGenerated = (meals: Meal[]) => {
    setGeneratedMeals(meals);
  };

  const handlePlanInfoGenerated = (info: any) => {
    setPlanInfo(info);
  };

  const handleMealSwap = async (mealIndex: number, newMeal: Meal) => {
    const updatedMeals = [...generatedMeals];
    updatedMeals[mealIndex] = newMeal;
    setGeneratedMeals(updatedMeals);
    showSuccessMessage(`${newMeal.category === 'meal' ? 'Meal' : 'Snack'} ${mealIndex + 1} updated successfully! 🎉`);
  };

  const handleGenerateNewPlan = async () => {
    try {
      const meals = await generateAIMeals(macroGoals, filters, foodPreferences, foodExclusions);
      const info = createPlanInfo(macroGoals, filters.mealConfiguration);
      
      setGeneratedMeals(meals);
      setPlanInfo(info);
      showSuccessMessage('New meal plan generated! 🎉');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      showSuccessMessage('Unable to generate new plan. Please try again.');
    }
  };

  const handleQuickMealReplace = async (mealIndex: number) => {
    setReplacingMealIndex(mealIndex);
    try {
      const newMeals = await generateAIMeals(macroGoals, filters, foodPreferences, foodExclusions);
      const currentMeal = generatedMeals[mealIndex];
      const replacement = newMeals.find(meal => 
        meal.category === currentMeal.category && 
        meal.name !== currentMeal.name
      );

      if (replacement) {
        handleMealSwap(mealIndex, replacement);
      } else {
        showSuccessMessage('No alternatives found. Try adjusting your preferences.');
      }
    } catch (error) {
      console.error('Quick replace error:', error);
      showSuccessMessage('Unable to find replacement. Please try again.');
    } finally {
      setReplacingMealIndex(null);
    }
  };

  const calculatePercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((actual / target) * 100);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 80 && percentage <= 120) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const targetMacros = {
    calories: parseInt(macroGoals.calories) || 0,
    protein: parseInt(macroGoals.protein) || 0,
    carbs: parseInt(macroGoals.carbs) || 0,
    fat: parseInt(macroGoals.fat) || 0
  };

  const actualTotals = generatedMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Get meal structure summary for display
  const getMealStructureSummary = () => {
    const meals = filters.mealConfiguration.mealCount;
    const snacks = filters.mealConfiguration.snackCount;
    
    let text = `${meals} meal${meals !== 1 ? 's' : ''}`;
    if (snacks > 0) {
      text += ` + ${snacks} snack${snacks !== 1 ? 's' : ''}`;
    }
    return text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] opacity-50"></div>
      
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 max-w-md bg-white border border-emerald-200 rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900">Success!</h4>
              <p className="text-sm text-emerald-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="text-emerald-500 hover:text-emerald-700 ml-auto"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="relative max-w-7xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Utensils className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
              Free Macro Calculator & AI Meal Generator
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium mb-6 sm:mb-8 px-4">
            Choose your meals & snacks, get AI-generated plans with perfect macro distribution
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-emerald-700 font-medium">🏛️ Science-Based Calculations</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700 font-medium">🤖 AI-Powered Meals</span>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-700 font-medium">🎯 Flexible Structure</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Macro Calculator */}
          <MacroCalculator onMacrosCalculated={handleMacrosCalculated} />

          {/* Show calculated macros summary */}
          {macrosCalculated && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 border border-emerald-200">
              <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Calculated Daily Targets
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="text-lg font-bold text-slate-900">{macroGoals.calories}</div>
                  <div className="text-xs text-slate-500">Calories</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-600">{macroGoals.protein}g</div>
                  <div className="text-xs text-slate-500">Protein</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-600">{macroGoals.carbs}g</div>
                  <div className="text-xs text-slate-500">Carbs</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                  <div className="text-lg font-bold text-amber-600">{macroGoals.fat}g</div>
                  <div className="text-xs text-slate-500">Fat</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Only show structure and preferences after macros are calculated */}
          {macrosCalculated && (
            <>
              <MealSnackSelector 
                filters={filters} 
                setFilters={setFilters} 
                showFilters={showFilters} 
                setShowFilters={setShowFilters} 
              />

              <TextPreferences
                preferences={foodPreferences}
                exclusions={foodExclusions}
                onPreferencesChange={setFoodPreferences}
                onExclusionsChange={setFoodExclusions}
                showPreferences={showPreferences}
                setShowPreferences={setShowPreferences}
              />

              {/* Meal Generator */}
              <div className="mb-8">
                <MealGenerator 
                  macroGoals={macroGoals}
                  filters={filters}
                  favoriteFoods={foodPreferences}
                  excludedFoods={foodExclusions}
                  onMealsGenerated={handleMealsGenerated}
                  onPlanInfoGenerated={handlePlanInfoGenerated}
                />
              </div>
            </>
          )}

          {/* Daily Meal Plan */}
          {planInfo && generatedMeals.length > 0 && (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom duration-700">
              {/* Plan Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{planInfo.routine.name}</h2>
                        <p className="text-slate-600 text-base sm:text-lg">{getMealStructureSummary()}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleGenerateNewPlan}
                      className="group px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
                    >
                      New Plan
                    </button>
                  </div>

                  {/* Daily Macro Summary */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 sm:p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4 text-base sm:text-lg">
                      Daily Total: <span className="text-xl sm:text-2xl font-bold text-indigo-600">{actualTotals.calories}</span> calories across {generatedMeals.length} meals/snacks
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      {[
                        { label: 'Protein', value: actualTotals.protein, unit: 'g', target: targetMacros.protein, color: 'blue' },
                        { label: 'Carbs', value: actualTotals.carbs, unit: 'g', target: targetMacros.carbs, color: 'green' },
                        { label: 'Fat', value: actualTotals.fat, unit: 'g', target: targetMacros.fat, color: 'amber' }
                      ].map((macro, macroSummaryIndex) => {
                        const percentage = calculatePercentage(macro.value, macro.target);
                        return (
                          <div key={`macro-summary-${macroSummaryIndex}`} className="text-center">
                            <div className={`text-xl sm:text-2xl font-bold text-${macro.color}-600`}>
                              {macro.value}{macro.unit}
                            </div>
                            <div className="text-sm text-slate-500 mb-2">{macro.label}</div>
                            {macro.target > 0 && (
                              <div className={`text-xs px-2 sm:px-3 py-1 rounded-full border font-medium ${getPercentageColor(percentage)}`}>
                                {percentage}% of goal
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Meal Plan */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Target className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500" />
                    Your AI-Generated Daily Structure
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleGenerateNewPlan}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200 text-emerald-700 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm order-2 sm:order-1"
                    >
                      🔄 Refresh All
                    </button>
                    
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium text-center order-1 sm:order-2">
                      🤖 AI-Powered
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {generatedMeals.map((meal, index) => {
                    // Generate structure to get meal info
                    const mealStructure = generateMealStructure(
                      filters.mealConfiguration.mealCount, 
                      filters.mealConfiguration.snackCount
                    );
                    const mealTypeInfo = mealStructure.mealTypes[index];
                    
                    return (
                      <div key={`meal-${meal.id}-${index}`} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        
                        {/* Beautiful Responsive Card */}
                        <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg">
                          
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                    meal.category === 'meal' 
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                                      : 'bg-gradient-to-r from-orange-400 to-red-500'
                                  }`}></div>
                                  <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                                    {mealTypeInfo?.name || `${meal.category} ${index + 1}`}
                                  </h4>
                                </div>
                                <h5 className="text-lg sm:text-xl font-semibold text-indigo-600 break-words">{meal.name}</h5>
                              </div>
                              
                              {/* Enhanced Tags */}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium capitalize ${
                                  meal.category === 'meal' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {meal.category === 'meal' ? '🍽️ Main Meal' : '🥨 Snack'}
                                </span>
                                <span className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs sm:text-sm font-medium capitalize">
                                  {meal.type}
                                </span>
                                {meal.dietary !== 'none' && meal.dietary !== 'ai-generated' && (
                                  <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium capitalize">
                                    {meal.dietary}
                                  </span>
                                )}
                                {mealTypeInfo && (
                                  <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-medium">
                                    {mealTypeInfo.caloriePercentage}% of daily calories
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => handleQuickMealReplace(index)}
                                disabled={replacingMealIndex === index}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-red-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100"
                                title="Generate new meal/snack"
                              >
                                {replacingMealIndex === index ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 relative">
                                        <div className="absolute inset-0 rounded-full border-2 border-red-200"></div>
                                        <div className="absolute inset-0 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div>
                                      </div>
                                      <span>Generating...</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm">🔄</span>
                                    Replace
                                  </>
                                )}
                              </button>

                              <div className="w-full sm:w-auto">
                                <MealSwapper
                                  currentMeal={meal}
                                  mealIndex={index}
                                  macroGoals={macroGoals}
                                  filters={filters}
                                  favoriteFoods={foodPreferences}
                                  excludedFoods={foodExclusions}
                                  onMealSwap={handleMealSwap}
                                />
                              </div>
                            </div>

                            {/* Enhanced Loading Overlay */}
                            {replacingMealIndex === index && (
                              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center z-10">
                                <div className="text-center p-6">
                                  <div className="relative w-16 h-16 mx-auto mb-4">
                                    <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-2xl">🤖</span>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-semibold text-slate-900 mb-2">
                                    Generating New {meal.category === 'meal' ? 'Meal' : 'Snack'}
                                  </h4>
                                  <p className="text-sm text-slate-600 mb-4">
                                    AI is creating a {meal.category === 'meal' ? 'delicious meal' : 'perfect snack'} alternative...
                                  </p>
                                  
                                  <div className="w-48 bg-slate-200 rounded-full h-2 mx-auto">
                                    <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                                  </div>
                                  
                                  <p className="text-xs text-slate-500 mt-3">This usually takes 3-5 seconds</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Macro Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                            {[
                              { label: 'Calories', value: meal.calories, color: 'slate' },
                              { label: 'Protein', value: `${meal.protein}g`, color: 'blue' },
                              { label: 'Carbs', value: `${meal.carbs}g`, color: 'green' },
                              { label: 'Fat', value: `${meal.fat}g`, color: 'amber' }
                            ].map((macro, macroIndex) => (
                              <div key={`macro-${index}-${macroIndex}`} className="text-center">
                                <div className={`text-lg sm:text-xl font-bold text-${macro.color}-600 leading-tight`}>
                                  {macro.value}
                                </div>
                                <div className="text-xs font-medium text-slate-500 mt-1">
                                  {macro.label}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Enhanced Ingredients Section */}
                          <div>
                            <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                              <Utensils className="h-4 w-4 text-slate-600" />
                              Ingredients
                            </h5>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                              {meal.ingredients.map((ingredient, ingredientIndex) => (
                                <div key={`ingredient-${meal.id}-${ingredientIndex}`} className="flex items-start gap-3 p-3 bg-white rounded-lg sm:rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                                    meal.category === 'meal' 
                                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                                      : 'bg-gradient-to-r from-orange-400 to-red-400'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                      <span className="font-semibold text-slate-900 text-sm">{ingredient.quantity}</span>
                                      <span className="text-slate-700 text-sm break-words">{ingredient.item}</span>
                                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium w-fit">
                                        🤖 AI
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 break-words">
                                      {ingredient.serving}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Enhanced Cooking Instructions */}
                            {(meal as any).instructions && (
                              <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h6 className="font-medium text-blue-900 mb-2 text-sm">
                                  {meal.category === 'meal' ? '🍳 Cooking Instructions:' : '🥨 Preparation:'}
                                </h6>
                                <ol className="text-sm text-blue-800 space-y-1">
                                  {(meal as any).instructions.map((step: string, stepIndex: number) => (
                                    <li key={`instruction-${meal.id}-${stepIndex}`} className="flex gap-2">
                                      <span className="font-medium flex-shrink-0">{stepIndex + 1}.</span>
                                      <span className="break-words">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                                {(meal as any).cookingTime && (
                                  <p className="text-xs text-blue-600 mt-2 break-words">
                                    ⏱️ {meal.category === 'meal' ? 'Cooking' : 'Prep'} time: {(meal as any).cookingTime}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* AI Description if available */}
                            {(meal as any).description && (
                              <div className="mt-4 p-3 sm:p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                <h6 className="font-medium text-indigo-900 mb-2 text-sm flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  Why This {meal.category === 'meal' ? 'Meal' : 'Snack'} Works:
                                </h6>
                                <p className="text-sm text-indigo-800">{(meal as any).description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced AI Features Info */}
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h4 className="font-semibold text-indigo-900 flex items-center gap-2 text-sm sm:text-base">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      AI-Powered Flexible Meal Planning
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-indigo-700 text-sm">
                        <strong>📅 Your Choice:</strong> {getMealStructureSummary()} with smart macro distribution.
                      </p>
                      <p className="text-indigo-700 text-sm">
                        <strong>🍽️ Meal Intelligence:</strong> Full recipes for meals, simple prep for snacks.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-indigo-700 text-sm">
                        <strong>🎯 Precision Targeting:</strong> Each item hits its exact calorie percentage target.
                      </p>
                      <p className="text-indigo-700 text-sm">
                        <strong>🔄 Smart Swapping:</strong> Replacements maintain meal type and appropriate sizing.
                      </p>
                    </div>
                  </div>
                  
                  {/* Current Structure Breakdown */}
                  <div className="bg-white/50 rounded-xl p-3 sm:p-4 border border-indigo-200">
                    <h5 className="font-medium text-indigo-900 mb-2 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Your Current Structure ({filters.mealConfiguration.mealCount + filters.mealConfiguration.snackCount} items)
                    </h5>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {(() => {
                        const structure = generateMealStructure(
                          filters.mealConfiguration.mealCount, 
                          filters.mealConfiguration.snackCount
                        );
                        return structure.mealTypes.map((item, structureIndex) => (
                          <span 
                            key={`structure-${structureIndex}-${item.type}`}
                            className={`px-2 py-1 rounded-full font-medium ${
                              item.category === 'meal'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {item.category === 'meal' ? '🍽️' : '🥨'} {item.name}: {item.caloriePercentage}%
                          </span>
                        ));
                      })()}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-indigo-700">
                      <div>
                        <p><strong>Meals ({filters.mealConfiguration.mealCount}):</strong> Complex recipes, complete nutrition</p>
                      </div>
                      <div>
                        <p><strong>Snacks ({filters.mealConfiguration.snackCount}):</strong> Simple ingredients, quick prep</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroMealGenerator;