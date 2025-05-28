// components/MealsList.tsx
import React from 'react';
import { Search } from 'lucide-react';
import { Meal, MacroGoals } from '../types';
import { getMatchPercentage } from '../utils/mealMatching';
import MealCard from './MealCard';

interface MealsListProps {
  meals: Meal[];
  macroGoals: MacroGoals;
  favorites: number[];
  onToggleFavorite: (mealId: number) => void;
  planSchedule?: string[];
}

const MealsList: React.FC<MealsListProps> = ({ 
  meals, 
  macroGoals, 
  favorites, 
  onToggleFavorite,
  planSchedule 
}) => {
  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No meals found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meals.map((meal, index) => {
        const matchPercentage = getMatchPercentage(meal, macroGoals);
        const isFavorite = favorites.includes(meal.id);
        const scheduleTime = planSchedule ? planSchedule[index] : null;
        
        return (
          <MealCard
            key={meal.id}
            meal={meal}
            matchPercentage={matchPercentage}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            scheduleTime={scheduleTime}
          />
        );
      })}
    </div>
  );
};

export default MealsList;