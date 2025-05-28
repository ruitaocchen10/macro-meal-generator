// utils/smartMealGenerator.ts
import { Meal, MacroGoals, Filters } from '../types';

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
    schedule: ["7:00 AM - Breakfast", "12:30 PM - Lunch", "6:30 PM - Dinner"],
    mealDistribution: {
      breakfast: { caloriePercent: 25, proteinPercent: 20, carbPercent: 30, fatPercent: 25 },
      lunch: { caloriePercent: 35, proteinPercent: 40, carbPercent: 40, fatPercent: 35 },
      dinner: { caloriePercent: 40, proteinPercent: 40, carbPercent: 30, fatPercent: 40 }
    }
  },
  {
    name: "Balanced 4-Meal",
    description: "Three main meals plus one snack for steady energy",
    schedule: ["7:00 AM - Breakfast", "12:30 PM - Lunch", "3:30 PM - Snack", "7:00 PM - Dinner"],
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
    schedule: ["7:00 AM - Breakfast", "10:30 AM - Mid-Morning", "1:00 PM - Lunch", "4:00 PM - Pre-Dinner", "7:30 PM - Dinner"],
    mealDistribution: {
      breakfast: { caloriePercent: 20, proteinPercent: 18, carbPercent: 25, fatPercent: 20 },
      "mid-morning": { caloriePercent: 15, proteinPercent: 25, carbPercent: 15, fatPercent: 15 },
      lunch: { caloriePercent: 25, proteinPercent: 25, carbPercent: 30, fatPercent: 25 },
      "pre-dinner": { caloriePercent: 15, proteinPercent: 20, carbPercent: 15, fatPercent: 15 },
      dinner: { caloriePercent: 25, proteinPercent: 12, carbPercent: 15, fatPercent: 25 }
    }
  }
];

// Your existing ingredient database (enhanced)
const ingredients = {
  proteins: [
    { name: 'Grilled chicken breast', protein: 7.5, carbs: 0, fat: 1.5, calsPerOz: 45 },
    { name: 'Salmon fillet', protein: 7, carbs: 0, fat: 4, calsPerOz: 60 },
    { name: 'Greek yogurt', protein: 6, carbs: 4, fat: 0, calsPerServing: 100, serving: '1 cup' },
    { name: 'Cottage cheese', protein: 12, carbs: 4, fat: 2, calsPerServing: 80, serving: '1/2 cup' },
    { name: 'Eggs', protein: 6, carbs: 1, fat: 5, calsPerServing: 70, serving: '1 large' },
    { name: 'Protein powder', protein: 25, carbs: 3, fat: 1, calsPerServing: 120, serving: '1 scoop' },
    { name: 'Lean ground turkey', protein: 8, carbs: 0, fat: 2, calsPerOz: 50 },
    { name: 'Tuna (canned)', protein: 7, carbs: 0, fat: 0.5, calsPerOz: 35 },
    { name: 'Tofu', protein: 4, carbs: 1, fat: 2, calsPerOz: 35 },
  ],
  carbs: [
    { name: 'Brown rice', protein: 1, carbs: 11, fat: 0.5, calsPerServing: 55, serving: '1/3 cup cooked' },
    { name: 'Quinoa', protein: 2, carbs: 10, fat: 1, calsPerServing: 55, serving: '1/3 cup cooked' },
    { name: 'Sweet potato', protein: 1, carbs: 15, fat: 0, calsPerServing: 65, serving: '1/2 medium' },
    { name: 'Oats', protein: 2, carbs: 14, fat: 1.5, calsPerServing: 75, serving: '1/3 cup dry' },
    { name: 'Whole wheat bread', protein: 2, carbs: 12, fat: 1, calsPerServing: 65, serving: '1 slice' },
    { name: 'Banana', protein: 0.5, carbs: 14, fat: 0, calsPerServing: 60, serving: '1/2 medium' },
    { name: 'Berries', protein: 0.5, carbs: 8, fat: 0, calsPerServing: 35, serving: '1/3 cup' },
  ],
  fats: [
    { name: 'Avocado', protein: 1, carbs: 2, fat: 7, calsPerServing: 70, serving: '1/4 medium' },
    { name: 'Olive oil', protein: 0, carbs: 0, fat: 14, calsPerServing: 120, serving: '1 tbsp' },
    { name: 'Almonds', protein: 2, carbs: 2, fat: 5, calsPerServing: 60, serving: '10 nuts' },
    { name: 'Almond butter', protein: 2, carbs: 2, fat: 8, calsPerServing: 95, serving: '1 tbsp' },
    { name: 'Coconut oil', protein: 0, carbs: 0, fat: 14, calsPerServing: 120, serving: '1 tbsp' },
    { name: 'Cheese', protein: 3, carbs: 0.5, fat: 4, calsPerServing: 50, serving: '2 tbsp shredded' },
  ],
  vegetables: [
    { name: 'Spinach', protein: 1, carbs: 1, fat: 0, calsPerServing: 10, serving: '1 cup fresh' },
    { name: 'Broccoli', protein: 1, carbs: 2, fat: 0, calsPerServing: 15, serving: '1/2 cup' },
    { name: 'Bell peppers', protein: 0.5, carbs: 3, fat: 0, calsPerServing: 15, serving: '1/4 cup diced' },
    { name: 'Cucumber', protein: 0.5, carbs: 2, fat: 0, calsPerServing: 10, serving: '1/2 cup diced' },
    { name: 'Asparagus', protein: 1, carbs: 2, fat: 0, calsPerServing: 15, serving: '1/2 cup' },
    { name: 'Cherry tomatoes', protein: 0.5, carbs: 2, fat: 0, calsPerServing: 10, serving: '1/4 cup' },
  ]
};

function filterByDietary(ingredientList: any[], dietary: string) {
  if (dietary === 'all') return ingredientList;
  
  const filters: { [key: string]: (ingredient: any) => boolean } = {
    'vegetarian': (ing) => !['chicken', 'salmon', 'turkey', 'tuna'].some(meat => 
      ing.name.toLowerCase().includes(meat)
    ),
    'vegan': (ing) => !['chicken', 'salmon', 'turkey', 'tuna', 'yogurt', 'cottage cheese', 'eggs', 'cheese'].some(animal => 
      ing.name.toLowerCase().includes(animal)
    ),
    'gluten-free': (ing) => !ing.name.toLowerCase().includes('bread'),
    'dairy-free': (ing) => !['yogurt', 'cottage cheese', 'cheese'].some(dairy => 
      ing.name.toLowerCase().includes(dairy)
    )
  };
  
  return ingredientList.filter(filters[dietary] || (() => true));
}

function generateMealForSlot(
  id: number,
  mealType: string,
  targetMacros: { calories: number; protein: number; carbs: number; fat: number },
  dietary: string
): Meal {
  const mealIngredients: any[] = [];
  let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

  // Determine meal structure based on type
  const mealStructures: { [key: string]: string[] } = {
    breakfast: ['protein', 'carb', 'fat'],
    lunch: ['protein', 'carb', 'fat', 'vegetable'],
    dinner: ['protein', 'carb', 'fat', 'vegetable'],
    snack: ['protein', 'fat'],
    "mid-morning": ['protein', 'carb'],
    "pre-dinner": ['protein', 'carb']
  };

  const structure = mealStructures[mealType] || ['protein', 'carb', 'fat'];

  // Add ingredients based on structure
  structure.forEach(macroType => {
    let categoryKey: keyof typeof ingredients;
    let targetAmount: number;

    switch (macroType) {
      case 'protein':
        categoryKey = 'proteins';
        targetAmount = targetMacros.protein;
        break;
      case 'carb':
        categoryKey = 'carbs';
        targetAmount = targetMacros.carbs;
        break;
      case 'fat':
        categoryKey = 'fats';
        targetAmount = targetMacros.fat;
        break;
      case 'vegetable':
        categoryKey = 'vegetables';
        targetAmount = 5; // Fixed small amount for vegetables
        break;
      default:
        return;
    }

    const options = filterByDietary(ingredients[categoryKey], dietary);
    if (options.length === 0) return;

    const ingredient = options[Math.floor(Math.random() * options.length)];
    
    // Calculate serving size
    let servingMultiplier = 1;
    const macroKey = macroType === 'carb' ? 'carbs' : macroType;
    
    if (macroType !== 'vegetable') {
      const ingredientMacroValue = ingredient[macroKey as keyof typeof ingredient] as number;
      if (ingredientMacroValue > 0) {
        servingMultiplier = Math.max(0.5, Math.min(3, targetAmount / ingredientMacroValue));
      }
    }

    // Add to meal
    const serving = ingredient.serving || (categoryKey === 'proteins' ? 'oz' : 'serving');
    const quantity = servingMultiplier === 1 ? '1x' : `${servingMultiplier.toFixed(1)}x`;
    
    mealIngredients.push({
      item: ingredient.name,
      quantity,
      serving
    });

    // Calculate macros
    const calories = servingMultiplier * (ingredient.calsPerServing || ingredient.calsPerOz || 50);
    totalCals += calories;
    totalProtein += servingMultiplier * ingredient.protein;
    totalCarbs += servingMultiplier * ingredient.carbs;
    totalFat += servingMultiplier * ingredient.fat;
  });

  // Generate meal name
  const mealNames: { [key: string]: string[] } = {
    breakfast: ['Power Breakfast', 'Morning Fuel', 'Sunrise Bowl', 'Energy Start'],
    lunch: ['Balanced Lunch', 'Midday Refuel', 'Power Bowl', 'Lean Plate'],
    dinner: ['Evening Feast', 'Dinner Delight', 'Night Fuel', 'Complete Meal'],
    snack: ['Quick Bite', 'Power Snack', 'Mini Meal', 'Energy Boost'],
    "mid-morning": ['Morning Boost', 'Pre-Lunch Fuel'],
    "pre-dinner": ['Afternoon Power', 'Pre-Dinner Bite']
  };

  const nameOptions = mealNames[mealType] || ['Macro Meal'];
  const mealName = nameOptions[Math.floor(Math.random() * nameOptions.length)];

  return {
    id,
    name: `${mealName}`,
    type: mealType,
    dietary: dietary === 'all' ? 'none' : dietary,
    calories: Math.round(totalCals),
    protein: Math.round(totalProtein),
    carbs: Math.round(totalCarbs),
    fat: Math.round(totalFat),
    ingredients: mealIngredients
  };
}

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

// Updated generateMeals function to create complete meal plan
export function generateMeals(macroGoals: MacroGoals, filters: Filters): Meal[] {
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

    const meal = generateMealForSlot(mealId++, mealType, targetMacros, filters.dietary);
    meals.push(meal);
  });

  return meals;
}

// New function to get the meal plan details
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