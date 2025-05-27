import React from 'react';
import { Heart } from 'lucide-react';
import { Meal } from '../types';

interface MealCardProps {
  meal: Meal;
  matchPercentage: number | null;
  isFavorite: boolean;
  onToggleFavorite: (mealId: number) => void;
}

const MealCard: React.FC<MealCardProps> = ({ 
  meal, 
  matchPercentage, 
  isFavorite, 
  onToggleFavorite 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{meal.name}</h3>
            {matchPercentage !== null && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {matchPercentage}% match
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="capitalize bg-gray-100 px-2 py-1 rounded">{meal.type}</span>
            <span className="capitalize bg-gray-100 px-2 py-1 rounded">{meal.dietary}</span>
          </div>
        </div>
        <button
          onClick={() => onToggleFavorite(meal.id)}
          className={`p-2 rounded-full transition-colors ${
            isFavorite 
              ? 'text-red-500 bg-red-50 hover:bg-red-100' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{meal.calories}</div>
          <div className="text-sm text-gray-500">Calories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{meal.protein}g</div>
          <div className="text-sm text-gray-500">Protein</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{meal.carbs}g</div>
          <div className="text-sm text-gray-500">Carbs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{meal.fat}g</div>
          <div className="text-sm text-gray-500">Fat</div>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Ingredients:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {meal.ingredients.map((ingredient, index) => (
            <div key={index} className="text-sm text-gray-600">
              <span className="font-medium">{ingredient.quantity}</span> {ingredient.item} 
              <span className="text-gray-400"> ({ingredient.serving})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MealCard;