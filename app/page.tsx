'use client';

import React, { useState, useEffect } from 'react';
import { MacroGoals, Filters, Meal } from '../types';
import { generateMeals, getMealPlanInfo } from '../utils/smartMealGenerator';
import { rebalanceMeals, generateRebalanceSummary } from '../utils/mealRebalancer';
import MacroGoalsInput from '../components/MacroGoalsInput';
import FiltersSection from '../components/FiltersSection';
import FoodPreferences from '../components/FoodPreferences';
import MealGenerator from '../components/MealGenerator';
import MealSwapper from '../components/MealSwapper';
import { Clock, TrendingUp, Target, Calendar, Utensils, Sparkles, BarChart3, CheckCircle } from 'lucide-react';

const MacroMealGenerator = () => {
  const [macroGoals, setMacroGoals] = useState<MacroGoals>({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  
  const [filters, setFilters] = useState<Filters>({
    mealType: 'all',
    dietary: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [rebalanceMessage, setRebalanceMessage] = useState<string>('');
  const [showRebalanceAlert, setShowRebalanceAlert] = useState(false);

  // Load favorite foods from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorite-foods');
    if (savedFavorites) {
      setFavoriteFoods(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorite foods to localStorage
  useEffect(() => {
    localStorage.setItem('favorite-foods', JSON.stringify(favoriteFoods));
  }, [favoriteFoods]);

  const handleMealsGenerated = (meals: Meal[]) => {
    setGeneratedMeals(meals);
  };

  const handlePlanInfoGenerated = (info: any) => {
    setPlanInfo(info);
  };

  const handleMealSwap = (mealIndex: number, newMeal: Meal) => {
    const originalMeals = [...generatedMeals];
    
    // Perform rebalancing
    const rebalanceResult = rebalanceMeals(
      generatedMeals,
      mealIndex,
      newMeal,
      macroGoals
    );

    // Update meals with rebalanced versions
    setGeneratedMeals(rebalanceResult.rebalancedMeals);

    // Generate and show rebalance summary
    const summary = generateRebalanceSummary(
      originalMeals,
      rebalanceResult.rebalancedMeals,
      mealIndex
    );

    setRebalanceMessage(`${rebalanceResult.message} ${summary}`);
    setShowRebalanceAlert(true);

    // Auto-hide alert after 5 seconds
    setTimeout(() => {
      setShowRebalanceAlert(false);
    }, 5000);
  };

  const handleGenerateNewPlan = async () => {
    try {
      const meals = generateMeals(macroGoals, filters, favoriteFoods);
      const info = getMealPlanInfo(macroGoals);
      
      setGeneratedMeals(meals);
      setPlanInfo(info);
      setShowRebalanceAlert(false); // Hide any existing alerts
    } catch (error) {
      console.error('Error generating meal plan:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] opacity-50"></div>
      
      {/* Rebalance Success Alert */}
      {showRebalanceAlert && (
        <div className="fixed top-4 right-4 max-w-md bg-white border border-emerald-200 rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900">Meal Plan Rebalanced!</h4>
              <p className="text-sm text-emerald-700 mt-1">{rebalanceMessage}</p>
            </div>
            <button
              onClick={() => setShowRebalanceAlert(false)}
              className="text-emerald-500 hover:text-emerald-700 ml-auto"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
              Macro Meal Planner
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Create personalized meal plans with smart rebalancing when you swap meals
          </p>
        </div>

        <div className="space-y-8">
          <MacroGoalsInput macroGoals={macroGoals} setMacroGoals={setMacroGoals} />
          
          <FiltersSection 
            filters={filters} 
            setFilters={setFilters} 
            showFilters={showFilters} 
            setShowFilters={setShowFilters} 
          />

          <FoodPreferences
            selectedFoods={favoriteFoods}
            onFoodsChange={setFavoriteFoods}
            showPreferences={showPreferences}
            setShowPreferences={setShowPreferences}
          />

          {!planInfo && (
            <MealGenerator 
              macroGoals={macroGoals}
              filters={filters}
              favoriteFoods={favoriteFoods}
              onMealsGenerated={handleMealsGenerated}
              onPlanInfoGenerated={handlePlanInfoGenerated}
            />
          )}

          {/* Daily Meal Plan - Main Feature */}
          {planInfo && generatedMeals.length > 0 && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
              {/* Plan Header */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur-xl opacity-20"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">{planInfo.routine.name}</h2>
                        <p className="text-slate-600 text-lg">{planInfo.routine.description}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleGenerateNewPlan}
                      className="group px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      New Plan
                    </button>
                  </div>

                  {/* Daily Macro Summary */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4 text-lg">
                      Daily Total: <span className="text-2xl font-bold text-indigo-600">{actualTotals.calories}</span> calories across {generatedMeals.length} meals
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: 'Protein', value: actualTotals.protein, unit: 'g', target: targetMacros.protein, color: 'blue' },
                        { label: 'Carbs', value: actualTotals.carbs, unit: 'g', target: targetMacros.carbs, color: 'green' },
                        { label: 'Fat', value: actualTotals.fat, unit: 'g', target: targetMacros.fat, color: 'amber' }
                      ].map((macro, index) => {
                        const percentage = calculatePercentage(macro.value, macro.target);
                        return (
                          <div key={index} className="text-center">
                            <div className={`text-2xl font-bold text-${macro.color}-600`}>
                              {macro.value}{macro.unit}
                            </div>
                            <div className="text-sm text-slate-500 mb-2">{macro.label}</div>
                            {macro.target > 0 && (
                              <div className={`text-xs px-3 py-1 rounded-full border font-medium ${getPercentageColor(percentage)}`}>
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

              {/* Meal Options */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <Target className="h-7 w-7 text-emerald-500" />
                  Your Personalized Meals
                  <div className="ml-auto">
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                      ✨ Smart Rebalancing Enabled
                    </div>
                  </div>
                </h3>

                <div className="grid gap-6">
                  {generatedMeals.map((meal, index) => (
                    <div key={meal.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                                <h4 className="text-xl font-bold text-slate-900">Meal {index + 1}</h4>
                              </div>
                              <h5 className="text-xl font-semibold text-indigo-600">{meal.name}</h5>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium capitalize">
                                {meal.type}
                              </span>
                              {meal.dietary !== 'none' && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium capitalize">
                                  {meal.dietary}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Meal Swapper Component */}
                          <MealSwapper
                            currentMeal={meal}
                            mealIndex={index}
                            macroGoals={macroGoals}
                            filters={filters}
                            favoriteFoods={favoriteFoods}
                            onMealSwap={handleMealSwap}
                          />
                        </div>

                        {/* Meal macros */}
                        <div className="grid grid-cols-4 gap-4 mb-6 bg-white rounded-xl p-4 border border-slate-100">
                          {[
                            { label: 'Calories', value: meal.calories, color: 'slate' },
                            { label: 'Protein', value: `${meal.protein}g`, color: 'blue' },
                            { label: 'Carbs', value: `${meal.carbs}g`, color: 'green' },
                            { label: 'Fat', value: `${meal.fat}g`, color: 'amber' }
                          ].map((macro, macroIndex) => (
                            <div key={macroIndex} className="text-center">
                              <div className={`text-xl font-bold text-${macro.color}-600`}>
                                {macro.value}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {macro.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Ingredients */}
                        <div>
                          <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-slate-600" />
                            Ingredients
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {meal.ingredients.map((ingredient, ingredientIndex) => (
                              <div key={ingredientIndex} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex-shrink-0"></div>
                                <div className="flex-1">
                                  <span className="font-semibold text-slate-900">{ingredient.quantity}</span>
                                  <span className="text-slate-700 ml-1">{ingredient.item}</span>
                                  <div className="text-xs text-slate-500">
                                    {ingredient.serving}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Smart Rebalancing Info */}
                <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Smart Rebalancing Active
                  </h4>
                  <p className="text-indigo-700 text-sm">
                    Don't like a meal? Use the "Swap Meal" button and we'll automatically adjust your other meals 
                    to keep you on track with your daily macro targets. No manual calculations needed!
                  </p>
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