// components/MealGenerator.tsx
import React, { useState } from 'react';
import { Wand2, Loader } from 'lucide-react';
import { MacroGoals, Filters, Meal } from '../types';

// Test without the import first
// import { generateMeals, getMealPlanInfo } from '../utils/smartMealGenerator';

interface MealGeneratorProps {
  macroGoals: MacroGoals;
  filters: Filters;
  onMealsGenerated: (meals: Meal[]) => void;
  onPlanInfoGenerated?: (planInfo: { routine: any; totalMacros: any }) => void;
}

const MealGenerator: React.FC<MealGeneratorProps> = ({ 
  macroGoals, 
  filters, 
  onMealsGenerated,
  onPlanInfoGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSmartMeals = async () => {
    setIsGenerating(true);

    // Add a small delay to show the loading state (feels more realistic)
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Temporarily use your old generateMeals function
      const { generateMeals } = await import('../utils/smartMealGenerator');
      const meals = generateMeals(macroGoals, filters);
      onMealsGenerated(meals);
    } catch (error) {
      console.error('Error generating meals:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasValidGoals = macroGoals.calories || macroGoals.protein || macroGoals.carbs || macroGoals.fat;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Wand2 className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900">Smart Meal Generator</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Generate personalized meals that match your macro goals using smart algorithms
        </p>

        <button
          onClick={generateSmartMeals}
          disabled={isGenerating || !hasValidGoals}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
            ${isGenerating || !hasValidGoals
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Generating Meals...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Meals
            </>
          )}
        </button>

        {!hasValidGoals && (
          <p className="text-sm text-gray-500 mt-2">
            Enter at least one macro goal to generate meals
          </p>
        )}
      </div>
    </div>
  );
};

export default MealGenerator;