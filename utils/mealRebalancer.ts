// utils/mealRebalancer.ts
import { Meal, MacroGoals } from '../types';

export interface MacroDeficit {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RebalanceResult {
  rebalancedMeals: Meal[];
  macroAdjustments: MacroDeficit;
  success: boolean;
  message: string;
}

/**
 * Rebalances meals when one meal is swapped to maintain daily macro targets
 */
export function rebalanceMeals(
  meals: Meal[],
  swappedMealIndex: number,
  newMeal: Meal,
  targetMacros: MacroGoals
): RebalanceResult {
  // Create a copy of meals with the new meal
  const updatedMeals = [...meals];
  const oldMeal = updatedMeals[swappedMealIndex];
  updatedMeals[swappedMealIndex] = newMeal;

  // Calculate the macro difference caused by the swap
  const macroDifference: MacroDeficit = {
    calories: oldMeal.calories - newMeal.calories,
    protein: oldMeal.protein - newMeal.protein,
    carbs: oldMeal.carbs - newMeal.carbs,
    fat: oldMeal.fat - newMeal.fat
  };

  // If the difference is minimal, no rebalancing needed
  if (isMinimalDifference(macroDifference)) {
    return {
      rebalancedMeals: updatedMeals,
      macroAdjustments: macroDifference,
      success: true,
      message: "Meal swapped successfully with minimal macro impact!"
    };
  }

  // Get meals that can be adjusted (exclude the swapped meal)
  const adjustableMealIndices = updatedMeals
    .map((_, index) => index)
    .filter(index => index !== swappedMealIndex);

  // Distribute the macro deficit across other meals
  const rebalancedMeals = distributeDeficitAcrossMeals(
    updatedMeals,
    adjustableMealIndices,
    macroDifference
  );

  // Calculate final totals to verify success
  const finalTotals = calculateMealTotals(rebalancedMeals);
  const targetTotals = {
    calories: parseInt(targetMacros.calories) || 0,
    protein: parseInt(targetMacros.protein) || 0,
    carbs: parseInt(targetMacros.carbs) || 0,
    fat: parseInt(targetMacros.fat) || 0
  };

  const success = isWithinAcceptableRange(finalTotals, targetTotals);

  return {
    rebalancedMeals,
    macroAdjustments: macroDifference,
    success,
    message: success 
      ? "Meal swapped and other meals automatically adjusted to maintain your daily targets!"
      : "Meal swapped! Small macro adjustments made to keep you close to your targets."
  };
}

/**
 * Distributes macro deficit across multiple meals intelligently
 */
function distributeDeficitAcrossMeals(
  meals: Meal[],
  adjustableIndices: number[],
  deficit: MacroDeficit
): Meal[] {
  const rebalanced = [...meals];
  const numAdjustable = adjustableIndices.length;

  if (numAdjustable === 0) return rebalanced;

  // Calculate how much each meal should be adjusted
  const adjustmentPerMeal = {
    calories: Math.round(deficit.calories / numAdjustable),
    protein: Math.round(deficit.protein / numAdjustable),
    carbs: Math.round(deficit.carbs / numAdjustable),
    fat: Math.round(deficit.fat / numAdjustable)
  };

  // Apply adjustments to each meal
  adjustableIndices.forEach((mealIndex, adjustIndex) => {
    const meal = rebalanced[mealIndex];
    
    // Calculate final adjustment (handle rounding for last meal)
    const isLastMeal = adjustIndex === numAdjustable - 1;
    const finalAdjustment = isLastMeal ? {
      calories: deficit.calories - (adjustmentPerMeal.calories * (numAdjustable - 1)),
      protein: deficit.protein - (adjustmentPerMeal.protein * (numAdjustable - 1)),
      carbs: deficit.carbs - (adjustmentPerMeal.carbs * (numAdjustable - 1)),
      fat: deficit.fat - (adjustmentPerMeal.fat * (numAdjustable - 1))
    } : adjustmentPerMeal;

    // Apply adjustments with bounds checking
    rebalanced[mealIndex] = {
      ...meal,
      calories: Math.max(100, meal.calories + finalAdjustment.calories), // Min 100 calories
      protein: Math.max(5, meal.protein + finalAdjustment.protein), // Min 5g protein
      carbs: Math.max(0, meal.carbs + finalAdjustment.carbs), // Min 0g carbs
      fat: Math.max(2, meal.fat + finalAdjustment.fat) // Min 2g fat
    };

    // Update ingredient quantities proportionally if significant change
    if (Math.abs(finalAdjustment.calories) > 50) {
      rebalanced[mealIndex] = adjustIngredientQuantities(
        rebalanced[mealIndex],
        meal,
        finalAdjustment.calories
      );
    }
  });

  return rebalanced;
}

/**
 * Adjusts ingredient quantities proportionally based on calorie changes
 */
function adjustIngredientQuantities(
  adjustedMeal: Meal,
  originalMeal: Meal,
  calorieChange: number
): Meal {
  const scaleFactor = adjustedMeal.calories / originalMeal.calories;
  
  const adjustedIngredients = originalMeal.ingredients.map(ingredient => {
    // Parse current quantity
    const currentQuantity = parseFloat(ingredient.quantity.replace('x', '')) || 1;
    const newQuantity = currentQuantity * scaleFactor;
    
    return {
      ...ingredient,
      quantity: newQuantity === 1 ? '1x' : `${newQuantity.toFixed(1)}x`
    };
  });

  return {
    ...adjustedMeal,
    ingredients: adjustedIngredients
  };
}

/**
 * Calculates total macros for all meals
 */
function calculateMealTotals(meals: Meal[]) {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Checks if macro difference is minimal and doesn't require rebalancing
 */
function isMinimalDifference(difference: MacroDeficit): boolean {
  return (
    Math.abs(difference.calories) < 50 &&
    Math.abs(difference.protein) < 5 &&
    Math.abs(difference.carbs) < 10 &&
    Math.abs(difference.fat) < 5
  );
}

/**
 * Checks if final totals are within acceptable range of targets
 */
function isWithinAcceptableRange(
  actual: { calories: number; protein: number; carbs: number; fat: number },
  target: { calories: number; protein: number; carbs: number; fat: number }
): boolean {
  const calorieRange = target.calories * 0.05; // 5% tolerance
  const proteinRange = target.protein * 0.1; // 10% tolerance
  const carbRange = target.carbs * 0.1; // 10% tolerance
  const fatRange = target.fat * 0.1; // 10% tolerance

  return (
    Math.abs(actual.calories - target.calories) <= calorieRange &&
    Math.abs(actual.protein - target.protein) <= proteinRange &&
    Math.abs(actual.carbs - target.carbs) <= carbRange &&
    Math.abs(actual.fat - target.fat) <= fatRange
  );
}

/**
 * Generates a summary of rebalancing changes for user feedback
 */
export function generateRebalanceSummary(
  originalMeals: Meal[],
  rebalancedMeals: Meal[],
  swappedIndex: number
): string {
  const changes: string[] = [];
  
  rebalancedMeals.forEach((meal, index) => {
    if (index === swappedIndex) return; // Skip the swapped meal
    
    const original = originalMeals[index];
    const calorieDiff = meal.calories - original.calories;
    
    if (Math.abs(calorieDiff) > 25) {
      const direction = calorieDiff > 0 ? 'increased' : 'decreased';
      changes.push(`${meal.name} ${direction} by ${Math.abs(calorieDiff)} calories`);
    }
  });

  if (changes.length === 0) {
    return "No other meals needed adjustment.";
  }

  return `Automatically adjusted: ${changes.join(', ')}.`;
}