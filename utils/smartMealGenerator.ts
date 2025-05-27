import { Meal, MacroGoals, Filters } from '../types';

// Ingredient database with macro info
const ingredients = {
  proteins: [
    { name: 'Grilled chicken breast', protein: 7.5, carbs: 0, fat: 1.5, calsPerOz: 45 },
    { name: 'Salmon fillet', protein: 7, carbs: 0, fat: 4, calsPerOz: 60 },
    { name: 'Greek yogurt', protein: 6, carbs: 4, fat: 0, calsPerCup: 100 },
    { name: 'Cottage cheese', protein: 12, carbs: 4, fat: 2, calsPerCup: 80 },
    { name: 'Eggs', protein: 6, carbs: 1, fat: 5, calsPerEgg: 70 },
    { name: 'Protein powder', protein: 25, carbs: 3, fat: 1, calsPerScoop: 120 },
    { name: 'Lean ground turkey', protein: 8, carbs: 0, fat: 2, calsPerOz: 50 },
    { name: 'Tuna (canned)', protein: 7, carbs: 0, fat: 0.5, calsPerOz: 35 },
    { name: 'Tofu', protein: 4, carbs: 1, fat: 2, calsPerOz: 35 },
  ],
  carbs: [
    { name: 'Brown rice', protein: 1, carbs: 11, fat: 0.5, calsPer: 55, unit: '1/3 cup cooked' },
    { name: 'Quinoa', protein: 2, carbs: 10, fat: 1, calsPer: 55, unit: '1/3 cup cooked' },
    { name: 'Sweet potato', protein: 1, carbs: 15, fat: 0, calsPer: 65, unit: '1/2 medium' },
    { name: 'Oats', protein: 2, carbs: 14, fat: 1.5, calsPer: 75, unit: '1/3 cup dry' },
    { name: 'Whole wheat bread', protein: 2, carbs: 12, fat: 1, calsPer: 65, unit: '1 slice' },
    { name: 'Banana', protein: 0.5, carbs: 14, fat: 0, calsPer: 60, unit: '1/2 medium' },
    { name: 'Berries', protein: 0.5, carbs: 8, fat: 0, calsPer: 35, unit: '1/3 cup' },
  ],
  fats: [
    { name: 'Avocado', protein: 1, carbs: 2, fat: 7, calsPer: 70, unit: '1/4 medium' },
    { name: 'Olive oil', protein: 0, carbs: 0, fat: 14, calsPer: 120, unit: '1 tbsp' },
    { name: 'Almonds', protein: 2, carbs: 2, fat: 5, calsPer: 60, unit: '10 nuts' },
    { name: 'Almond butter', protein: 2, carbs: 2, fat: 8, calsPer: 95, unit: '1 tbsp' },
    { name: 'Coconut oil', protein: 0, carbs: 0, fat: 14, calsPer: 120, unit: '1 tbsp' },
    { name: 'Cheese', protein: 3, carbs: 0.5, fat: 4, calsPer: 50, unit: '2 tbsp shredded' },
  ],
  vegetables: [
    { name: 'Spinach', protein: 1, carbs: 1, fat: 0, calsPer: 10, unit: '1 cup fresh' },
    { name: 'Broccoli', protein: 1, carbs: 2, fat: 0, calsPer: 15, unit: '1/2 cup' },
    { name: 'Bell peppers', protein: 0.5, carbs: 3, fat: 0, calsPer: 15, unit: '1/4 cup diced' },
    { name: 'Cucumber', protein: 0.5, carbs: 2, fat: 0, calsPer: 10, unit: '1/2 cup diced' },
    { name: 'Asparagus', protein: 1, carbs: 2, fat: 0, calsPer: 15, unit: '1/2 cup' },
    { name: 'Cherry tomatoes', protein: 0.5, carbs: 2, fat: 0, calsPer: 10, unit: '1/4 cup' },
  ]
};

interface MealTemplate {
  base: string;
  protein: boolean;
  carb: boolean;
  fat: boolean;
  veggie: boolean;
}

const mealTemplates: Record<string, MealTemplate[]> = {
  breakfast: [
    { base: 'protein', protein: false, carb: true, fat: true, veggie: false },
    { base: 'carb', protein: true, carb: false, fat: true, veggie: false },
  ],
  lunch: [
    { base: 'protein', protein: false, carb: true, fat: true, veggie: true },
    { base: 'protein', protein: false, carb: false, fat: true, veggie: true },
  ],
  dinner: [
    { base: 'protein', protein: false, carb: true, fat: true, veggie: true },
    { base: 'protein', protein: false, carb: true, fat: false, veggie: true },
  ],
  snack: [
    { base: 'protein', protein: false, carb: false, fat: true, veggie: false },
    { base: 'carb', protein: true, carb: false, fat: true, veggie: false },
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

function generateMeal(
    id: number, 
    type: string, 
    macroGoals: MacroGoals, 
    dietary: string
  ): Meal {
    const templates = mealTemplates[type];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const targetCals = Math.max(200, parseInt(macroGoals.calories) || 400);
    const targetProtein = Math.max(15, parseInt(macroGoals.protein) || 25);
    const targetCarbs = Math.max(20, parseInt(macroGoals.carbs) || 30);
    const targetFat = Math.max(10, parseInt(macroGoals.fat) || 15);
    
    let mealIngredients: any[] = [];
    let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    // Base ingredient (protein or carb)
    const baseCategory = template.base === 'protein' ? 'proteins' : 'carbs';
    const baseOptions = filterByDietary(ingredients[baseCategory as keyof typeof ingredients], dietary);
    const baseIngredient = baseOptions[Math.floor(Math.random() * baseOptions.length)];
    
    // Calculate portion size for base ingredient
    let baseAmount = 1;
    if (baseCategory === 'proteins') {
      baseAmount = Math.max(3, Math.min(8, targetProtein / Math.max(1, baseIngredient.protein)));
      mealIngredients.push({
        item: baseIngredient.name,
        quantity: `${Math.round(baseAmount)} oz`,
        serving: 'lean'
      });
      totalCals += baseAmount * ((baseIngredient as any).calsPerOz || 50);
      totalProtein += baseAmount * baseIngredient.protein;
      totalCarbs += baseAmount * baseIngredient.carbs;
      totalFat += baseAmount * baseIngredient.fat;
    } else {
      baseAmount = Math.max(0.5, Math.min(2, targetCarbs / Math.max(1, baseIngredient.carbs)));
      mealIngredients.push({
        item: baseIngredient.name,
        quantity: `${baseAmount.toFixed(1)}x`,
        serving: (baseIngredient as any).unit || 'serving'
      });
      totalCals += baseAmount * ((baseIngredient as any).calsPer || 50);
      totalProtein += baseAmount * baseIngredient.protein;
      totalCarbs += baseAmount * baseIngredient.carbs;
      totalFat += baseAmount * baseIngredient.fat;
    }
    
    // Add other components based on template
    if (template.protein && baseCategory !== 'proteins') {
      const proteinOptions = filterByDietary(ingredients.proteins, dietary);
      const protein = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
      const proteinAmount = Math.max(2, Math.min(6, (targetProtein - totalProtein) / Math.max(1, protein.protein)));
      
      mealIngredients.push({
        item: protein.name,
        quantity: `${Math.round(proteinAmount)} oz`,
        serving: 'lean'
      });
      totalCals += proteinAmount * ((protein as any).calsPerOz || 50);
      totalProtein += proteinAmount * protein.protein;
      totalCarbs += proteinAmount * protein.carbs;
      totalFat += proteinAmount * protein.fat;
    }
    
    if (template.carb && baseCategory !== 'carbs') {
      const carbOptions = filterByDietary(ingredients.carbs, dietary);
      const carb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
      const carbAmount = Math.max(0.5, Math.min(2, (targetCarbs - totalCarbs) / Math.max(1, carb.carbs)));
      
      mealIngredients.push({
        item: carb.name,
        quantity: `${carbAmount.toFixed(1)}x`,
        serving: (carb as any).unit || 'serving'
      });
      totalCals += carbAmount * ((carb as any).calsPer || 50);
      totalProtein += carbAmount * carb.protein;
      totalCarbs += carbAmount * carb.carbs;
      totalFat += carbAmount * carb.fat;
    }
    
    if (template.fat) {
      const fatOptions = filterByDietary(ingredients.fats, dietary);
      const fat = fatOptions[Math.floor(Math.random() * fatOptions.length)];
      const fatAmount = Math.max(0.5, Math.min(2, (targetFat - totalFat) / Math.max(1, fat.fat)));
      
      mealIngredients.push({
        item: fat.name,
        quantity: `${fatAmount.toFixed(1)}x`,
        serving: (fat as any).unit || 'serving'
      });
      totalCals += fatAmount * ((fat as any).calsPer || 50);
      totalProtein += fatAmount * fat.protein;
      totalCarbs += fatAmount * fat.carbs;
      totalFat += fatAmount * fat.fat;
    }
    
    if (template.veggie) {
      const veggieOptions = filterByDietary(ingredients.vegetables, dietary);
      const veggie = veggieOptions[Math.floor(Math.random() * veggieOptions.length)];
      
      mealIngredients.push({
        item: veggie.name,
        quantity: '1x',
        serving: (veggie as any).unit || 'serving'
      });
      totalCals += (veggie as any).calsPer || 15;
      totalProtein += veggie.protein;
      totalCarbs += veggie.carbs;
      totalFat += veggie.fat;
    }
    
    // Generate creative meal name
    const mealNames = {
      breakfast: ['Power Bowl', 'Morning Fuel', 'Sunrise Special', 'Energy Boost', 'AM Kickstart'],
      lunch: ['Balance Bowl', 'Midday Refuel', 'Power Lunch', 'Lean & Green', 'Macro Bowl'],
      dinner: ['Evening Feast', 'Dinner Delight', 'Night Fuel', 'Balanced Plate', 'Complete Meal'],
      snack: ['Quick Bite', 'Power Snack', 'Mini Meal', 'Energy Boost', 'Macro Snack']
    };
    
    const nameOptions = mealNames[type as keyof typeof mealNames];
    const baseName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const mainIngredient = mealIngredients[0].item.split(' ')[0];
    
    return {
      id,
      name: `${mainIngredient} ${baseName}`,
      type,
      dietary: dietary === 'all' ? 'none' : dietary,
      calories: Math.round(totalCals) || 400,
      protein: Math.round(totalProtein) || 25,
      carbs: Math.round(totalCarbs) || 30,
      fat: Math.round(totalFat) || 15,
      ingredients: mealIngredients
    };
  }

export function generateMeals(macroGoals: MacroGoals, filters: Filters): Meal[] {
  const meals: Meal[] = [];
  const mealTypes = filters.mealType === 'all' 
    ? ['breakfast', 'lunch', 'dinner', 'snack']
    : [filters.mealType];
  
  const mealsPerType = Math.ceil(8 / mealTypes.length);
  
  let id = 1;
  for (const type of mealTypes) {
    for (let i = 0; i < mealsPerType && meals.length < 8; i++) {
      meals.push(generateMeal(id++, type, macroGoals, filters.dietary));
    }
  }
  
  return meals;
}