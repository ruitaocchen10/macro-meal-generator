// types/index.ts - Flexible Meal/Snack Selection
export interface MacroGoals {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface MealConfiguration {
  mealCount: number; // 1-6 meals
  snackCount: number; // 0-6 snacks
}

export interface Filters {
  mealConfiguration: MealConfiguration;
  dietary: string;
  cookingTime?: string; // Add this line
}

export interface Ingredient {
  item: string;
  quantity: string;
  serving: string;
}

export interface Meal {
  id: number;
  name: string;
  type: string;
  category: 'meal' | 'snack';
  dietary: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  // Optional AI-generated properties
  description?: string;
  instructions?: string[];
  cookingTime?: string;
  difficulty?: string;
  cuisineStyle?: string;
  cookingMethod?: string;
}
// Helper function to generate dynamic meal structure
export function generateMealStructure(mealCount: number, snackCount: number) {
  const totalItems = mealCount + snackCount;
  
  // Calculate calorie percentages
  // Meals get larger portions, snacks get smaller portions
  const mealCaloriePercentage = mealCount > 0 ? Math.round(75 / mealCount) : 0;
  const snackCaloriePercentage = snackCount > 0 ? Math.round(25 / snackCount) : 0;
  
  // Adjust if total doesn't equal 100%
  const totalPercentage = (mealCaloriePercentage * mealCount) + (snackCaloriePercentage * snackCount);
  const adjustment = totalPercentage !== 100 ? (100 - totalPercentage) / totalItems : 0;
  
  const adjustedMealPercentage = Math.round(mealCaloriePercentage + adjustment);
  const adjustedSnackPercentage = Math.round(snackCaloriePercentage + adjustment);

  const structure = [];
  
  // Add meals
  const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Second Breakfast', 'Late Lunch', 'Second Dinner'];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'second-breakfast', 'late-lunch', 'second-dinner'];
  
  for (let i = 0; i < mealCount; i++) {
    structure.push({
      type: mealTypes[i] || `meal-${i + 1}`,
      name: mealNames[i] || `Meal ${i + 1}`,
      category: 'meal' as const,
      caloriePercentage: adjustedMealPercentage
    });
  }
  
  // Add snacks
  const snackNames = ['Morning Snack', 'Afternoon Snack', 'Evening Snack', 'Pre-Workout Snack', 'Post-Workout Snack', 'Night Snack'];
  const snackTypes = ['morning-snack', 'afternoon-snack', 'evening-snack', 'pre-workout-snack', 'post-workout-snack', 'night-snack'];
  
  for (let i = 0; i < snackCount; i++) {
    structure.push({
      type: snackTypes[i] || `snack-${i + 1}`,
      name: snackNames[i] || `Snack ${i + 1}`,
      category: 'snack' as const,
      caloriePercentage: adjustedSnackPercentage
    });
  }
  
  return {
    totalItems,
    mealTypes: structure
  };
}