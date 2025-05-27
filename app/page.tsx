'use client';

import React, { useState, useEffect } from 'react';
import { MacroGoals, Filters, Meal } from '../types';
import { calculateMatchScore } from '../utils/mealMatching';
import MacroGoalsInput from '../components/MacroGoalsInput';
import FiltersSection from '../components/FiltersSection';
import MealsList from '../components/MealsList';
import MealGenerator from '../components/MealGenerator';

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

  const toggleFavorite = (mealId: number) => {
    setFavorites(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Macro Meal Generator</h1>
          <p className="text-gray-600">Get personalized meal recommendations powered by AI</p>
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
        />

        {filteredMeals.length > 0 && (
          <MealsList 
            meals={filteredMeals}
            macroGoals={macroGoals}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>
    </div>
  );
};

export default MacroMealGenerator;