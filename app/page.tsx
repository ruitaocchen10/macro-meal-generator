'use client';

import React, { useState, useEffect } from 'react';
import { MacroGoals, Filters, Meal } from '../types';
import { calculateMatchScore } from '../utils/mealMatching';
import MacroGoalsInput from '../components/MacroGoalsInput';
import FiltersSection from '../components/FiltersSection';
import MealsList from '../components/MealsList';
import MealGenerator from '../components/MealGenerator';
import { Clock, TrendingUp, Target } from 'lucide-react';

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
  
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [planInfo, setPlanInfo] = useState<any>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('macro-meal-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('macro-meal-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Filter and sort meals when generated meals or filters change
  useEffect(() => {
    let filtered = generatedMeals;

    // Apply filters if meals exist
    if (generatedMeals.length > 0) {
      filtered = generatedMeals.filter(meal => {
        const mealTypeMatch = filters.mealType === 'all' || meal.type === filters.mealType;
        const dietaryMatch = filters.dietary === 'all' || meal.dietary === filters.dietary || meal.dietary === 'none';
        return mealTypeMatch && dietaryMatch;
      });

      // Sort by match score (lower is better)
      if (macroGoals.calories || macroGoals.protein || macroGoals.carbs || macroGoals.fat) {
        filtered.sort((a, b) => calculateMatchScore(a, macroGoals) - calculateMatchScore(b, macroGoals));
      }
    }

    setFilteredMeals(filtered);
  }, [generatedMeals, filters, macroGoals]);

  const handleMealsGenerated = (meals: Meal[]) => {
    setGeneratedMeals(meals);
  };

  const handlePlanInfoGenerated = (info: any) => {
    setPlanInfo(info);
  };

  const toggleFavorite = (mealId: number) => {
    setFavorites(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const calculatePercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((actual / target) * 100);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'text-green-600 bg-green-100';
    if (percentage >= 80 && percentage <= 120) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const targetMacros = {
    calories: parseInt(macroGoals.calories) || 0,
    protein: parseInt(macroGoals.protein) || 0,
    carbs: parseInt(macroGoals.carbs) || 0,
    fat: parseInt(macroGoals.fat) || 0
  };

  const actualTotals = filteredMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Macro Meal Generator</h1>
          <p className="text-gray-600">Get a complete daily eating routine with personalized meal recommendations</p>
        </div>

        <MacroGoalsInput macroGoals={macroGoals} setMacroGoals={setMacroGoals} />
        
        <FiltersSection 
          filters={filters} 
          setFilters={setFilters} 
          showFilters={showFilters} 
          setShowFilters={setShowFilters} 
        />

        <MealGenerator 
          macroGoals={macroGoals}
          filters={filters}
          onMealsGenerated={handleMealsGenerated}
          onPlanInfoGenerated={handlePlanInfoGenerated}
        />

        {/* Plan Overview */}
        {planInfo && filteredMeals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900">Your Personalized Meal Plan</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{planInfo.routine.name}</h3>
                <p className="text-gray-600 mb-4">{planInfo.routine.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>{planInfo.routine.schedule.length} meals per day</span>
                </div>

                {/* Eating Schedule */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Your Schedule:</h4>
                  {planInfo.routine.schedule.map((schedule: string, index: number) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-2 text-sm text-blue-900">
                      {schedule}
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Daily Macro Totals</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{actualTotals.calories}</div>
                    <div className="text-xs text-gray-500">Calories</div>
                    {targetMacros.calories > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getPercentageColor(calculatePercentage(actualTotals.calories, targetMacros.calories))}`}>
                        {calculatePercentage(actualTotals.calories, targetMacros.calories)}% of goal
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{actualTotals.protein}g</div>
                    <div className="text-xs text-gray-500">Protein</div>
                    {targetMacros.protein > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getPercentageColor(calculatePercentage(actualTotals.protein, targetMacros.protein))}`}>
                        {calculatePercentage(actualTotals.protein, targetMacros.protein)}% of goal
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{actualTotals.carbs}g</div>
                    <div className="text-xs text-gray-500">Carbs</div>
                    {targetMacros.carbs > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getPercentageColor(calculatePercentage(actualTotals.carbs, targetMacros.carbs))}`}>
                        {calculatePercentage(actualTotals.carbs, targetMacros.carbs)}% of goal
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{actualTotals.fat}g</div>
                    <div className="text-xs text-gray-500">Fat</div>
                    {targetMacros.fat > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getPercentageColor(calculatePercentage(actualTotals.fat, targetMacros.fat))}`}>
                        {calculatePercentage(actualTotals.fat, targetMacros.fat)}% of goal
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meals Section */}
        {filteredMeals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Your Meals {planInfo && `(${planInfo.routine.name})`}
              </h3>
              
              <button 
                onClick={() => {
                  const newMeals = require('../utils/smartMealGenerator').generateMeals(macroGoals, filters);
                  const newPlanInfo = require('../utils/smartMealGenerator').getMealPlanInfo(macroGoals);
                  setGeneratedMeals(newMeals);
                  setPlanInfo(newPlanInfo);
                }}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                Generate New Plan
              </button>
            </div>

            <MealsList 
              meals={filteredMeals}
              macroGoals={macroGoals}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              planSchedule={planInfo?.routine.schedule}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MacroMealGenerator;