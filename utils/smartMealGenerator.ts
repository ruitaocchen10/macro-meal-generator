// utils/smartMealGenerator.ts
import { Meal, MacroGoals, Filters } from '../types';
import { foodDatabase, Food, getFoodsByCategory, filterFoodsByDietary, getFoodById } from './foodDatabase';

// Add new types to your existing types/index.ts
export interface MealPlan {
  id: string;
  name: string;
  description: string;
  totalMeals: number;
  eatingSchedule: string[];
  meals: Meal[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface EatingRoutine {
  name: string;
  description: string;
  schedule: string[];
  mealDistribution: {
    [key: string]: {
      caloriePercent: number;
      proteinPercent: number;
      carbPercent: number;
      fatPercent: number;
    };
  };
}

// Predefined eating routines
const eatingRoutines: EatingRoutine[] = [
  {
    name: "Classic 3-Meal",
    description: "Traditional breakfast, lunch, and dinner approach",
    schedule: ["Breakfast", "Lunch", "Dinner"],
    mealDistribution: {
      breakfast: { caloriePercent: 25, proteinPercent: 20, carbPercent: 30, fatPercent: 25 },
      lunch: { caloriePercent: 35, proteinPercent: 40, carbPercent: 40, fatPercent: 35 },
      dinner: { caloriePercent: 40, proteinPercent: 40, carbPercent: 30, fatPercent: 40 }
    }
  },
  {
    name: "Balanced 4-Meal",
    description: "Three main meals plus one snack for steady energy",
    schedule: ["Breakfast", "Lunch", "Snack", "Dinner"],
    mealDistribution: {
      breakfast: { caloriePercent: 25, proteinPercent: 20, carbPercent: 30, fatPercent: 25 },
      lunch: { caloriePercent: 30, proteinPercent: 35, carbPercent: 35, fatPercent: 30 },
      snack: { caloriePercent: 15, proteinPercent: 15, carbPercent: 20, fatPercent: 15 },
      dinner: { caloriePercent: 30, proteinPercent: 30, carbPercent: 15, fatPercent: 30 }
    }
  },
  {
    name: "Athletic 5-Meal",
    description: "Five smaller meals for optimal nutrient timing",
    schedule: ["Breakfast", "Mid-Morning", "Lunch", "Pre-Dinner", "Dinner"],
    mealDistribution: {
      breakfast: { caloriePercent: 20, proteinPercent: 18, carbPercent: 25, fatPercent: 20 },
      "mid-morning": { caloriePercent: 15, proteinPercent: 25, carbPercent: 15, fatPercent: 15 },
      lunch: { caloriePercent: 25, proteinPercent: 25, carbPercent: 30, fatPercent: 25 },
      "pre-dinner": { caloriePercent: 15, proteinPercent: 20, carbPercent: 15, fatPercent: 15 },
      dinner: { caloriePercent: 25, proteinPercent: 12, carbPercent: 15, fatPercent: 25 }
    }
  }
];

function selectBestRoutine(macroGoals: MacroGoals): EatingRoutine {
  const totalCals = parseInt(macroGoals.calories) || 2000;
  
  // Simple logic to select routine based on calories
  if (totalCals < 1800) {
    return eatingRoutines[0]; // 3-meal for lower calories
  } else if (totalCals < 2500) {
    return eatingRoutines[1]; // 4-meal for moderate calories
  } else {
    return eatingRoutines[2]; // 5-meal for higher calories
  }
}

function selectFoodFromCategory(
  category: Food['category'], 
  dietary: string, 
  favoriteFoodIds: string[] = []
): Food {
  // Get all foods in category
  let categoryFoods = getFoodsByCategory(category);
  
  // Apply dietary filters
  categoryFoods = filterFoodsByDietary(categoryFoods, dietary);
  
  // Prioritize favorite foods if any are available
  const favoritesInCategory = categoryFoods.filter(food => favoriteFoodIds.includes(food.id));
  
  if (favoritesInCategory.length > 0) {
    // 80% chance to pick from favorites, 20% chance for variety
    const useFavorite = Math.random() < 0.8;
    if (useFavorite) {
      return favoritesInCategory[Math.floor(Math.random() * favoritesInCategory.length)];
    }
  }
  
  // Fallback to any food in category
  if (categoryFoods.length === 0) {
    // If no foods match dietary restrictions, use any food from category
    categoryFoods = getFoodsByCategory(category);
  }
  
  return categoryFoods[Math.floor(Math.random() * categoryFoods.length)];
}

function generateMealForSlot(
  id: number,
  mealType: string,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  dietary: string,
  favoriteFoodIds: string[] = []
): Meal {
  const mealIngredients: any[] = [];
  let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

  // Determine meal structure based on type
  const mealStructures: { [key: string]: string[] } = {
    breakfast: ['proteins', 'carbs', 'fats'],
    lunch: ['proteins', 'carbs', 'fats', 'vegetables'],
    dinner: ['proteins', 'carbs', 'fats', 'vegetables'],
    snack: ['proteins', 'fats'],
    "mid-morning": ['proteins', 'carbs'],
    "pre-dinner": ['proteins', 'carbs']
  };

  const structure = mealStructures[mealType] || ['proteins', 'carbs', 'fats'];

  // Add ingredients based on structure
  structure.forEach(categoryType => {
    let targetAmount: number;
    let category = categoryType as Food['category'];

    switch (categoryType) {
      case 'proteins':
        targetAmount = targetMacros.protein;
        break;
      case 'carbs':
        targetAmount = targetMacros.carbs;
        break;
      case 'fats':
        targetAmount = targetMacros.fat;
        break;
      case 'vegetables':
        targetAmount = 15; // Fixed amount for vegetables (in calories)
        break;
      default:
        return;
    }

    const selectedFood = selectFoodFromCategory(category, dietary, favoriteFoodIds);
    
    // Calculate serving size to hit target macros
    let servingMultiplier = 1;
    
    if (categoryType === 'vegetables') {
      // For vegetables, base on calories
      servingMultiplier = Math.max(0.5, Math.min(2, targetAmount / selectedFood.calsPerServing));
    } else {
      // For other categories, base on primary macro
      const primaryMacro = categoryType === 'proteins' ? selectedFood.protein :
                          categoryType === 'carbs' ? selectedFood.carbs :
                          selectedFood.fat;
      
      if (primaryMacro > 0) {
        servingMultiplier = Math.max(0.3, Math.min(2.5, targetAmount / primaryMacro));
      }
    }

    // Add to meal ingredients
    const quantity = servingMultiplier === 1 ? '1x' : `${servingMultiplier.toFixed(1)}x`;
    
    mealIngredients.push({
      item: selectedFood.name,
      quantity,
      serving: selectedFood.serving
    });

    // Calculate actual macros
    const actualCals = servingMultiplier * selectedFood.calsPerServing;
    const actualProtein = servingMultiplier * selectedFood.protein;
    const actualCarbs = servingMultiplier * selectedFood.carbs;
    const actualFat = servingMultiplier * selectedFood.fat;

    totalCals += actualCals;
    totalProtein += actualProtein;
    totalCarbs += actualCarbs;
    totalFat += actualFat;
  });

  // Generate meal name
  const mealNames: { [key: string]: string[] } = {
    breakfast: ['Power Breakfast', 'Morning Fuel', 'Sunrise Bowl', 'Energy Start', 'Breakfast Bowl'],
    lunch: ['Balanced Lunch', 'Midday Refuel', 'Power Bowl', 'Lean Plate', 'Lunch Special'],
    dinner: ['Evening Feast', 'Dinner Delight', 'Night Fuel', 'Complete Meal', 'Dinner Bowl'],
    snack: ['Quick Bite', 'Power Snack', 'Mini Meal', 'Energy Boost', 'Smart Snack'],
    "mid-morning": ['Morning Boost', 'Pre-Lunch Fuel', 'Mid-Morning Pick-Me-Up'],
    "pre-dinner": ['Afternoon Power', 'Pre-Dinner Bite', 'Evening Prep']
  };

  const nameOptions = mealNames[mealType] || ['Macro Meal'];
  const mealName = nameOptions[Math.floor(Math.random() * nameOptions.length)];

  return {
    id,
    name: mealName,
    type: mealType,
    dietary: dietary === 'all' ? 'none' : dietary,
    calories: Math.round(totalCals),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
    ingredients: mealIngredients
  };
}

// Updated generateMeals function to use favorites
export function generateMeals(
  macroGoals: MacroGoals, 
  filters: Filters, 
  favoriteFoodIds: string[] = []
): Meal[] {
  // Select best eating routine
  const routine = selectBestRoutine(macroGoals);
  
  // Parse macro goals
  const totalCals = parseInt(macroGoals.calories) || 2000;
  const totalProtein = parseInt(macroGoals.protein) || 150;
  const totalCarbs = parseInt(macroGoals.carbs) || 200;
  const totalFat = parseInt(macroGoals.fat) || 65;

  // Generate meals for each slot in the routine
  const meals: Meal[] = [];
  let mealId = 1;

  Object.keys(routine.mealDistribution).forEach(mealType => {
    const distribution = routine.mealDistribution[mealType];
    
    const targetMacros = {
      calories: Math.round(totalCals * distribution.caloriePercent / 100),
      protein: Math.round(totalProtein * distribution.proteinPercent / 100),
      carbs: Math.round(totalCarbs * distribution.carbPercent / 100),
      fat: Math.round(totalFat * distribution.fatPercent / 100)
    };

    const meal = generateMealForSlot(mealId++, mealType, targetMacros, filters.dietary, favoriteFoodIds);
    meals.push(meal);
  });

  return meals;
}

// Function to get the meal plan details
export function getMealPlanInfo(macroGoals: MacroGoals): { routine: EatingRoutine; totalMacros: any } {
  const routine = selectBestRoutine(macroGoals);
  const totalMacros = {
    calories: parseInt(macroGoals.calories) || 0,
    protein: parseInt(macroGoals.protein) || 0,
    carbs: parseInt(macroGoals.carbs) || 0,
    fat: parseInt(macroGoals.fat) || 0
  };
  
  return { routine, totalMacros };
}