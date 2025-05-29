'use client';

import React, { useState, useEffect } from 'react';
import { MacroGoals, Filters, Meal } from '../types';
import { generateAIMeals } from '../utils/aiMealGenerator';
import MacroGoalsInput from '../components/MacroGoalsInput';
import FiltersSection from '../components/FiltersSection';
import TextPreferences from '../components/TextPreferences';
import MealGenerator from '../components/MealGenerator';
import MealSwapper from '../components/MealSwapper';
import { Clock, TrendingUp, Target, Calendar, Utensils, Sparkles, BarChart3, CheckCircle, Dumbbell } from 'lucide-react';

const MacroMealGenerator = () => {
  const [macroGoals, setMacroGoals] = useState<MacroGoals>({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  
  const [filters, setFilters] = useState<Filters>({
    cookingTime: 'any',
    dietary: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [planInfo, setPlanInfo] = useState<{ totalMeals: number; routine: { name: string; description: string } } | null>(null);
  const [currentDayType, setCurrentDayType] = useState<'training' | 'rest'>('training');
  const [baseMacroGoals, setBaseMacroGoals] = useState<MacroGoals>({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Helper functions
  const getMealCount = (calories: string) => {
    const totalCals = parseInt(calories) || 2000;
    return totalCals < 1800 ? 3 : totalCals < 2500 ? 4 : 5;
  };

  const createPlanInfo = (macroGoals: MacroGoals) => {
    const mealCount = getMealCount(macroGoals.calories);
    return {
      totalMeals: mealCount,
      routine: {
        name: `${mealCount}-Meal Plan`,
        description: "AI-optimized meal distribution for your goals"
      }
    };
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 4000);
  };

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('food-preferences');
    if (savedPreferences) {
      setFoodPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('food-preferences', JSON.stringify(foodPreferences));
  }, [foodPreferences]);

  const handleMealsGenerated = (meals: Meal[]) => {
    setGeneratedMeals(meals);
  };

  const handlePlanInfoGenerated = (info: any) => {
    setPlanInfo(info);
  };

  const handleMealSwap = async (mealIndex: number, newMeal: Meal) => {
    // Simple swap without rebalancing - just replace the meal
    const updatedMeals = [...generatedMeals];
    updatedMeals[mealIndex] = newMeal;
    setGeneratedMeals(updatedMeals);
    showSuccessMessage(`Meal ${mealIndex + 1} updated successfully! 🎉`);
  };

  const handleGenerateNewPlan = async () => {
    try {
      const meals = await generateAIMeals(macroGoals, filters, foodPreferences);
      const info = createPlanInfo(macroGoals);
      
      setGeneratedMeals(meals);
      setPlanInfo(info);
      showSuccessMessage('New meal plan generated! 🎉');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      showSuccessMessage('Unable to generate new plan. Please try again.');
    }
  };

  const handleMacroAdjustment = async (adjustedMacros: MacroGoals, dayType: 'training' | 'rest') => {
    setMacroGoals(adjustedMacros);
    setCurrentDayType(dayType);
    
    // If there are existing meals, regenerate with new macros
    if (generatedMeals.length > 0) {
      try {
        const meals = await generateAIMeals(adjustedMacros, filters, foodPreferences);
        const info = createPlanInfo(adjustedMacros);
        setGeneratedMeals(meals);
        setPlanInfo(info);
      } catch (error) {
        console.error('Error adjusting plan:', error);
      }
    }
  };

  const handleLeftoverAdded = (leftover: any) => {
    console.log('Leftover added:', leftover);
    showSuccessMessage('Leftover integration feature coming soon! 🚀');
  };

  const handlePlanAdjustedForLeftovers = (adjustedMeals: Meal[]) => {
    setGeneratedMeals(adjustedMeals);
    showSuccessMessage('Plan adjusted to account for your leftovers!');
  };

  // Auto-generate when macros are complete
  const checkAndAutoGenerate = async (macros: MacroGoals) => {
    if (!autoGenerateEnabled || isAutoGenerating) return;
    
    const hasAllMacros = macros.calories && macros.protein && macros.carbs && macros.fat;
    if (hasAllMacros && !planInfo) {
      setIsAutoGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      try {
        const meals = await generateAIMeals(macros, filters, foodPreferences);
        const info = createPlanInfo(macros);
        setGeneratedMeals(meals);
        setPlanInfo(info);
        showSuccessMessage('Your personalized meal plan is ready! 🎉');
      } catch (error) {
        console.error('Auto-generation error:', error);
        showSuccessMessage('Auto-generation failed. Please try generating manually.');
      } finally {
        setIsAutoGenerating(false);
      }
    }
  };

  // Enhanced macro goals handler with auto-generation
  const handleMacroGoalsChange = (goals: MacroGoals) => {
    setBaseMacroGoals(goals);
    setMacroGoals(goals);
    checkAndAutoGenerate(goals);
  };

  // Quick meal replacement
  const handleQuickMealReplace = async (mealIndex: number) => {
    try {
      // Generate new meals and pick one of the same type
      const newMeals = await generateAIMeals(macroGoals, filters, foodPreferences);
      const currentMeal = generatedMeals[mealIndex];
      const replacement = newMeals.find(meal => 
        meal.type === currentMeal.type && meal.name !== currentMeal.name
      );

      if (replacement) {
        handleMealSwap(mealIndex, replacement);
      } else {
        showSuccessMessage('No alternatives found. Try adjusting your preferences.');
      }
    } catch (error) {
      console.error('Quick replace error:', error);
      showSuccessMessage('Unable to find replacement. Please try again.');
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
      
      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
              AI Meal Planner
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium mb-8">
            Create personalized meal plans with AI-powered nutrition optimization
          </p>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-emerald-700 font-medium">🏛️ USDA Verified Data</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700 font-medium">🤖 AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-700 font-medium">⚡ Instant Generation</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Enhanced Macro Goals Input with Auto-Generate */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Daily Macro Goals</h2>
                    <p className="text-slate-600">Enter targets and AI will auto-generate your plan</p>
                  </div>
                </div>
                
                {/* Auto-Generate Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Auto-generate</span>
                  <button
                    onClick={() => setAutoGenerateEnabled(!autoGenerateEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      autoGenerateEnabled ? 'bg-indigo-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                      autoGenerateEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                  {isAutoGenerating && (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                      <span className="text-sm font-medium">Generating...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <MacroGoalsInput 
                macroGoals={baseMacroGoals} 
                setMacroGoals={handleMacroGoalsChange}
              />
            </div>
          </div>

          {/* Training Day Adjuster */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${currentDayType === 'training' ? 'from-emerald-500 to-emerald-600' : 'from-blue-500 to-blue-600'} rounded-xl shadow-lg`}>
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Training Day Optimizer</h2>
                  <p className="text-slate-600 text-sm">Adjust macros based on your activity level</p>
                </div>
              </div>
            </div>

            {/* Day Type Toggle */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => {
                  setCurrentDayType('training');
                  const adjustedMacros = {
                    calories: Math.round((parseInt(baseMacroGoals.calories) || 0) * 1.1).toString(),
                    protein: Math.round((parseInt(baseMacroGoals.protein) || 0) * 1.2).toString(),
                    carbs: Math.round((parseInt(baseMacroGoals.carbs) || 0) * 1.3).toString(),
                    fat: Math.round((parseInt(baseMacroGoals.fat) || 0) * 0.9).toString()
                  };
                  handleMacroAdjustment(adjustedMacros, 'training');
                }}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  currentDayType === 'training'
                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">💪</div>
                  <h3 className={`font-bold text-lg mb-1 ${currentDayType === 'training' ? 'text-emerald-900' : 'text-slate-900'}`}>
                    Training Day
                  </h3>
                  <p className={`text-sm ${currentDayType === 'training' ? 'text-emerald-700' : 'text-slate-600'}`}>
                    Higher carbs and calories for performance
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentDayType('rest');
                  const adjustedMacros = {
                    calories: Math.round((parseInt(baseMacroGoals.calories) || 0) * 0.95).toString(),
                    protein: Math.round((parseInt(baseMacroGoals.protein) || 0) * 1.1).toString(),
                    carbs: Math.round((parseInt(baseMacroGoals.carbs) || 0) * 0.8).toString(),
                    fat: Math.round((parseInt(baseMacroGoals.fat) || 0) * 1.1).toString()
                  };
                  handleMacroAdjustment(adjustedMacros, 'rest');
                }}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  currentDayType === 'rest'
                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🧘</div>
                  <h3 className={`font-bold text-lg mb-1 ${currentDayType === 'rest' ? 'text-blue-900' : 'text-slate-900'}`}>
                    Rest Day
                  </h3>
                  <p className={`text-sm ${currentDayType === 'rest' ? 'text-blue-700' : 'text-slate-600'}`}>
                    Optimized for recovery with balanced macros
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          <FiltersSection 
            filters={filters} 
            setFilters={setFilters} 
            showFilters={showFilters} 
            setShowFilters={setShowFilters} 
          />

          <TextPreferences
            preferences={foodPreferences}
            onPreferencesChange={setFoodPreferences}
            showPreferences={showPreferences}
            setShowPreferences={setShowPreferences}
          />

          {!planInfo && !isAutoGenerating && (
            <div className="mb-8">
              <MealGenerator 
                macroGoals={macroGoals}
                filters={filters}
                favoriteFoods={foodPreferences}
                onMealsGenerated={handleMealsGenerated}
                onPlanInfoGenerated={handlePlanInfoGenerated}
              />
            </div>
          )}

          {/* Auto-Generation Progress */}
          {isAutoGenerating && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl shadow-xl border border-indigo-200 p-8 animate-pulse">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-500"></div>
                  <div>
                    <h3 className="text-2xl font-bold text-indigo-900">AI Creating Your Perfect Plan</h3>
                    <p className="text-indigo-700">Analyzing your macros and generating optimized meals...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Meal Plan */}
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

              {/* Meal Plan */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Target className="h-7 w-7 text-emerald-500" />
                    Your AI-Generated Meals
                  </h3>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGenerateNewPlan}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 hover:from-emerald-200 hover:to-teal-200 text-emerald-700 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm"
                    >
                      🔄 Refresh All
                    </button>
                    
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                      🤖 AI-Powered
                    </div>
                  </div>
                </div>

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
                              {meal.dietary !== 'none' && meal.dietary !== 'ai-generated' && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium capitalize">
                                  {meal.dietary}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Meal Swapper */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuickMealReplace(index)}
                              className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-red-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium"
                              title="Generate new meal"
                            >
                              <span className="text-sm">🔄</span>
                              Replace
                            </button>

                            <MealSwapper
                              currentMeal={meal}
                              mealIndex={index}
                              macroGoals={macroGoals}
                              filters={filters}
                              favoriteFoods={foodPreferences}
                              onMealSwap={handleMealSwap}
                            />
                          </div>
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
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-slate-900">{ingredient.quantity}</span>
                                    <span className="text-slate-700 ml-1">{ingredient.item}</span>
                                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                      🤖 AI
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {ingredient.serving}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Show cooking instructions if available */}
                          {(meal as any).instructions && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                              <h6 className="font-medium text-blue-900 mb-2">🍳 Instructions:</h6>
                              <ol className="text-sm text-blue-800 space-y-1">
                                {(meal as any).instructions.map((step: string, stepIndex: number) => (
                                  <li key={stepIndex} className="flex gap-2">
                                    <span className="font-medium">{stepIndex + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                              {(meal as any).cookingTime && (
                                <p className="text-xs text-blue-600 mt-2">
                                  ⏱️ Cooking time: {(meal as any).cookingTime}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Features Info */}
                <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI-Powered Meal Planning
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-indigo-700 text-sm mb-2">
                        <strong>🎯 Precision Targeting:</strong> AI calculates meals to hit your exact macro goals.
                      </p>
                      <p className="text-indigo-700 text-sm">
                        <strong>🔄 Instant Alternatives:</strong> Don't like a meal? Get instant AI-generated replacements.
                      </p>
                    </div>
                    <div>
                      <p className="text-indigo-700 text-sm mb-2">
                        <strong>🍽️ Infinite Variety:</strong> Never run out of meal ideas with AI creativity.
                      </p>
                      <p className="text-indigo-700 text-sm">
                        <strong>⚡ Real-Time Generation:</strong> All meals created fresh based on your preferences.
                      </p>
                    </div>
                  </div>
                  
                  {/* Data Quality Assurance */}
                  <div className="bg-white/50 rounded-xl p-4 border border-indigo-200">
                    <h5 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Nutrition Data You Can Trust
                    </h5>
                    <p className="text-indigo-700 text-xs mb-3">
                      AI-generated meals use verified nutritional data to ensure accuracy for your health goals.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span className="text-emerald-700">USDA database</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-blue-700">AI-optimized</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span className="text-purple-700">Real-time generation</span>
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