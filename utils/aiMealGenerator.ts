// utils/aiMealGenerator.ts (Enhanced Primary System)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MacroGoals, Filters, Meal } from '../types';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');

export interface AIGeneratedMeal {
  name: string;
  type: string;
  description: string;
  ingredients: Array<{
    item: string;
    quantity: string;
    serving: string;
  }>;
  instructions?: string[];
  cookingTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

// Enhanced meal generation with better precision and reliability
export async function generateAIMeals(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build enhanced prompt with better macro precision
    const prompt = buildEnhancedMealPrompt(macroGoals, filters, favoriteFoods, userPrompt);
    
    console.log('AI Prompt:', prompt); // Debug logging

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Response:', text); // Debug logging

    // Parse and validate the AI response
    const meals = parseAndValidateAIResponse(text, macroGoals);
    
    if (meals.length === 0) {
      throw new Error('No valid meals generated');
    }

    return meals;

  } catch (error) {
    console.error('AI Generation Error:', error);
    // Enhanced fallback with better error handling
    return generateFallbackMeals(macroGoals, filters);
  }
}

function buildEnhancedMealPrompt(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteNames: string[],
  userPrompt?: string
): string {
  // Calculate meal distribution for better accuracy
  const totalCalories = parseInt(macroGoals.calories) || 2000;
  const totalProtein = parseInt(macroGoals.protein) || 150;
  const totalCarbs = parseInt(macroGoals.carbs) || 200;
  const totalFat = parseInt(macroGoals.fat) || 65;

  // Determine number of meals based on calories
  const numMeals = totalCalories < 1800 ? 3 : totalCalories < 2500 ? 4 : 5;
  
  const mealTypes = numMeals === 3 
    ? ['breakfast', 'lunch', 'dinner']
    : numMeals === 4 
    ? ['breakfast', 'lunch', 'snack', 'dinner']
    : ['breakfast', 'mid-morning', 'lunch', 'afternoon-snack', 'dinner'];

  const basePrompt = `
You are a professional nutritionist and meal planning expert. Create a ${numMeals}-meal daily plan that PRECISELY hits these macro targets:

EXACT DAILY TARGETS (must be met within 5% accuracy):
- Calories: ${totalCalories}
- Protein: ${totalProtein}g 
- Carbs: ${totalCarbs}g
- Fat: ${totalFat}g

MEAL DISTRIBUTION:
${mealTypes.map((type, index) => {
  const caloriePercent = numMeals === 3 
    ? [25, 35, 40][index]
    : numMeals === 4
    ? [25, 30, 15, 30][index]
    : [20, 15, 25, 15, 25][index];
  
  return `${type}: ~${Math.round(totalCalories * caloriePercent / 100)} calories`;
}).join('\n')}

DIETARY REQUIREMENTS:
- Restriction: ${filters.dietary === 'all' ? 'None' : filters.dietary}
- Focus: ${filters.mealType === 'all' ? 'Balanced variety' : `Emphasize ${filters.mealType}`}

${favoriteNames.length > 0 ? `PRIORITIZE THESE FOODS: ${favoriteNames.join(', ')}` : ''}

${userPrompt ? `SPECIAL REQUEST: ${userPrompt}` : ''}

CRITICAL REQUIREMENTS:
1. Each meal must have realistic portions and accurate macro calculations
2. Ingredients must include specific quantities (e.g., "150g chicken breast", "1 cup rice")
3. Total daily macros must sum to within 5% of targets
4. Meals should be practical and cookable
5. Include variety in proteins, carbs, and fats

Return response in this EXACT JSON format:
{
  "meals": [
    {
      "name": "Descriptive Meal Name",
      "type": "${mealTypes[0]}",
      "description": "Brief appetizing description",
      "ingredients": [
        {
          "item": "specific ingredient name",
          "quantity": "exact amount (150g, 1 cup, 2 tbsp)",
          "serving": "serving description"
        }
      ],
      "macros": {
        "calories": exact_number,
        "protein": exact_number,
        "carbs": exact_number,
        "fat": exact_number
      },
      "instructions": ["step 1", "step 2", "step 3"],
      "cookingTime": "15 minutes",
      "difficulty": "Easy"
    }
  ],
  "dailyTotals": {
    "calories": sum_of_all_meals,
    "protein": sum_of_all_meals,
    "carbs": sum_of_all_meals,
    "fat": sum_of_all_meals
  }
}

VALIDATION: Before responding, verify that dailyTotals match the targets within 5%.`;

  return basePrompt;
}

function parseAndValidateAIResponse(aiResponse: string, macroGoals: MacroGoals): Meal[] {
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      throw new Error('Invalid meal format in AI response');
    }

    // Validate daily totals if provided
    if (parsed.dailyTotals) {
      const targetCalories = parseInt(macroGoals.calories) || 0;
      const actualCalories = parsed.dailyTotals.calories;
      const calorieAccuracy = Math.abs(actualCalories - targetCalories) / targetCalories;
      
      if (calorieAccuracy > 0.15) { // 15% tolerance
        console.warn('AI meal plan exceeds calorie tolerance:', { target: targetCalories, actual: actualCalories });
      }
    }

    // Convert AI meals to our Meal format with enhanced data
    const meals = parsed.meals.map((aiMeal: any, index: number) => {
      const meal: Meal = {
        id: index + 1,
        name: aiMeal.name || `AI Meal ${index + 1}`,
        type: aiMeal.type || 'meal',
        dietary: 'ai-generated',
        calories: Math.round(aiMeal.macros?.calories || 400),
        protein: Math.round(aiMeal.macros?.protein || 25),
        carbs: Math.round(aiMeal.macros?.carbs || 30),
        fat: Math.round(aiMeal.macros?.fat || 15),
        ingredients: aiMeal.ingredients || []
      };

      // Add AI-specific data if the type supports it (optional properties)
      if (aiMeal.description) {
        (meal as any).description = aiMeal.description;
      }
      if (aiMeal.instructions) {
        (meal as any).instructions = aiMeal.instructions;
      }
      if (aiMeal.cookingTime) {
        (meal as any).cookingTime = aiMeal.cookingTime;
      }
      if (aiMeal.difficulty) {
        (meal as any).difficulty = aiMeal.difficulty;
      }

      // Validate individual meal macros
      if (meal.calories < 50 || meal.calories > 1500) {
        console.warn('Suspicious calorie count for meal:', meal.name, meal.calories);
      }

      return meal;
    });

    return meals;

  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw AI response:', aiResponse);
    throw error;
  }
}

// Enhanced fallback system with better meal generation
function generateFallbackMeals(macroGoals: MacroGoals, filters: Filters): Meal[] {
  console.log('Using enhanced fallback meal generation');
  
  const totalCalories = parseInt(macroGoals.calories) || 2000;
  const totalProtein = parseInt(macroGoals.protein) || 150;
  const totalCarbs = parseInt(macroGoals.carbs) || 200;
  const totalFat = parseInt(macroGoals.fat) || 65;

  // Determine meal count and distribution
  const numMeals = totalCalories < 1800 ? 3 : 4;
  const caloriePerMeal = Math.round(totalCalories / numMeals);
  const proteinPerMeal = Math.round(totalProtein / numMeals);
  const carbsPerMeal = Math.round(totalCarbs / numMeals);
  const fatPerMeal = Math.round(totalFat / numMeals);

  const fallbackMeals: Meal[] = [];
  const mealTypes = numMeals === 3 
    ? ['breakfast', 'lunch', 'dinner']
    : ['breakfast', 'lunch', 'snack', 'dinner'];

  // Generate balanced fallback meals
  mealTypes.forEach((type, index) => {
    const mealTemplates = getFallbackMealTemplates(type, filters.dietary);
    const template = mealTemplates[Math.floor(Math.random() * mealTemplates.length)];
    
    fallbackMeals.push({
      id: index + 1,
      name: template.name,
      type: type,
      dietary: filters.dietary === 'all' ? 'none' : filters.dietary,
      calories: caloriePerMeal,
      protein: proteinPerMeal,
      carbs: carbsPerMeal,
      fat: fatPerMeal,
      ingredients: template.ingredients
    });
  });

  return fallbackMeals;
}

function getFallbackMealTemplates(mealType: string, dietary: string) {
  const templates = {
    breakfast: [
      {
        name: 'Protein Breakfast Bowl',
        ingredients: [
          { item: 'Greek yogurt', quantity: '1 cup', serving: '200g' },
          { item: 'Mixed berries', quantity: '1/2 cup', serving: '75g' },
          { item: 'Granola', quantity: '1/4 cup', serving: '30g' }
        ]
      },
      {
        name: 'Balanced Morning Meal',
        ingredients: [
          { item: 'Oatmeal', quantity: '1/2 cup dry', serving: '40g' },
          { item: 'Banana', quantity: '1 medium', serving: '120g' },
          { item: 'Almond butter', quantity: '1 tbsp', serving: '15g' }
        ]
      }
    ],
    lunch: [
      {
        name: 'Balanced Lunch Plate',
        ingredients: [
          { item: 'Lean protein', quantity: '150g', serving: '150g' },
          { item: 'Brown rice', quantity: '1/2 cup cooked', serving: '100g' },
          { item: 'Mixed vegetables', quantity: '1 cup', serving: '150g' }
        ]
      }
    ],
    dinner: [
      {
        name: 'Balanced Dinner',
        ingredients: [
          { item: 'Protein source', quantity: '150g', serving: '150g' },
          { item: 'Sweet potato', quantity: '1 medium', serving: '150g' },
          { item: 'Green vegetables', quantity: '1 cup', serving: '150g' }
        ]
      }
    ],
    snack: [
      {
        name: 'Protein Snack',
        ingredients: [
          { item: 'Protein source', quantity: '1 serving', serving: '30g' },
          { item: 'Fruit', quantity: '1 piece', serving: '100g' }
        ]
      }
    ]
  };

  return templates[mealType as keyof typeof templates] || templates.lunch;
}

// Enhanced meal generation with natural language prompts
export async function generateMealsWithPrompt(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  userPrompt: string
): Promise<Meal[]> {
  return generateAIMeals(macroGoals, filters, favoriteFoods, userPrompt);
}

// Smart ingredient substitution with AI
export async function suggestIngredientSubstitutes(
  ingredient: string,
  dietary: string = 'all'
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
Suggest 5 healthy substitutes for "${ingredient}" that would work in meal planning.
${dietary !== 'all' ? `Must be compatible with ${dietary} diet.` : ''}

Requirements:
- Similar nutritional profile (calories, protein, carbs, fat)
- Easy to find in grocery stores
- Works in similar cooking methods

Return just a comma-separated list of alternatives, no extra text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.split(',').map(item => item.trim()).filter(item => item.length > 0);
  } catch (error) {
    console.error('Error getting substitutes:', error);
    return [];
  }
}

// Recipe enhancement with cooking instructions
export async function enhanceRecipeWithInstructions(meal: Meal): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const ingredientsList = meal.ingredients
      .map(ing => `${ing.quantity} ${ing.item}`)
      .join(', ');
    
    const prompt = `
Create step-by-step cooking instructions for: "${meal.name}"

Ingredients: ${ingredientsList}

Target macros: ${meal.calories} calories, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat

Requirements:
- 5-8 clear, concise cooking steps
- Each step should be one sentence
- Include cooking times and temperatures
- Focus on simplicity and accuracy

Return as a JSON array of strings: ["step 1", "step 2", ...]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Error enhancing recipe:', error);
    return [];
  }
}