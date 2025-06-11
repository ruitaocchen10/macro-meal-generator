import { Meal, MacroGoals } from '../types';

export const calculateMatchScore = (meal: Meal, macroGoals: MacroGoals): number => {
  if (!macroGoals.calories && !macroGoals.protein && !macroGoals.carbs && !macroGoals.fat) {
    return 0;
  }

  let totalDifference = 0;
  let validGoals = 0;

  if (macroGoals.calories) {
    totalDifference += Math.abs(meal.calories - parseInt(macroGoals.calories));
    validGoals++;
  }
  if (macroGoals.protein) {
    totalDifference += Math.abs(meal.protein - parseInt(macroGoals.protein)) * 4; // Weight protein higher
    validGoals++;
  }
  if (macroGoals.carbs) {
    totalDifference += Math.abs(meal.carbs - parseInt(macroGoals.carbs)) * 2;
    validGoals++;
  }
  if (macroGoals.fat) {
    totalDifference += Math.abs(meal.fat - parseInt(macroGoals.fat)) * 3;
    validGoals++;
  }

  return validGoals > 0 ? totalDifference / validGoals : 1000;
};

export const getMatchPercentage = (meal: Meal, macroGoals: MacroGoals): number | null => {
  if (!macroGoals.calories && !macroGoals.protein && !macroGoals.carbs && !macroGoals.fat) {
    return null;
  }

  const score = calculateMatchScore(meal, macroGoals);
  const maxScore = 200;
  const percentage = Math.max(0, Math.min(100, 100 - (score / maxScore) * 100));
  return Math.round(percentage);
};