// utils/aiMealGenerator.ts (Enhanced for Realistic Meals)
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

// Enhanced meal generation with realistic, practical meals
export async function generateAIMeals(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build enhanced prompt for realistic meals
    const prompt = buildRealisticMealPrompt(macroGoals, filters, favoriteFoods, userPrompt);
    
    console.log('AI Prompt:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Response:', text);

    // Parse and validate the AI response
    const meals = parseAndValidateAIResponse(text, macroGoals);
    
    if (meals.length === 0) {
      throw new Error('No valid meals generated');
    }

    return meals;

  } catch (error) {
    console.error('AI Generation Error:', error);
    throw error; // Let the calling component handle the error
  }
}

function buildRealisticMealPrompt(
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

  // Get cooking time preference
  const cookingTimeGuidance = getCookingTimeGuidance(filters.cookingTime);
  const dietaryGuidance = getDietaryGuidance(filters.dietary);

  const basePrompt = `
You are a professional meal planner creating REALISTIC, PRACTICAL meals that people actually cook and eat. 

DAILY MACRO TARGETS (must be met within 10% accuracy):
- Calories: ${totalCalories}
- Protein: ${totalProtein}g 
- Carbs: ${totalCarbs}g
- Fat: ${totalFat}g

MEAL STRUCTURE: Create ${numMeals} meals
${mealTypes.map((type, index) => {
  const caloriePercent = numMeals === 3 
    ? [30, 35, 35][index]
    : numMeals === 4
    ? [25, 30, 15, 30][index]
    : [20, 15, 25, 15, 25][index];
  
  return `${index + 1}. ${type}: ~${Math.round(totalCalories * caloriePercent / 100)} calories`;
}).join('\n')}

REALISM REQUIREMENTS:
- Use common, easily found ingredients (no exotic superfoods)
- Simple cooking methods (baking, grilling, sautéing, steaming)
- Realistic portion sizes (e.g., "6 oz chicken breast", "1 cup cooked rice")
- Popular, recognizable meal names (e.g., "Grilled Chicken & Rice Bowl")
- Ingredients available at any grocery store
- Consider prep time and difficulty

${cookingTimeGuidance}

${dietaryGuidance}

${favoriteNames.length > 0 ? `USER PREFERENCES: Try to incorporate these when possible: ${favoriteNames.join(', ')}` : ''}

${userPrompt ? `SPECIAL REQUEST: ${userPrompt}` : ''}

MEAL EXAMPLES TO FOLLOW:
Breakfast: "Scrambled Eggs with Toast", "Greek Yogurt with Berries", "Oatmeal with Banana"
Lunch: "Grilled Chicken Salad", "Turkey Sandwich with Side Salad", "Chicken Rice Bowl"
Dinner: "Baked Salmon with Sweet Potato", "Ground Turkey Pasta", "Chicken Stir-Fry"
Snacks: "Apple with Peanut Butter", "Greek Yogurt", "Mixed Nuts"

INGREDIENT REQUIREMENTS:
- Use specific, measurable quantities (150g, 1 cup, 2 tbsp, 1 medium, etc.)
- Common proteins: chicken breast, ground turkey, salmon, eggs, greek yogurt, tofu
- Common carbs: rice, bread, pasta, potatoes, oats, fruits
- Common fats: olive oil, nuts, avocado, cheese
- Always include vegetables when appropriate

MACRO CALCULATION ACCURACY:
- Base calculations on USDA nutrition data
- Be precise with portions to hit macro targets
- Each meal should be nutritionally balanced

Return response in this EXACT JSON format:
{
  "meals": [
    {
      "name": "Simple, Recognizable Meal Name",
      "type": "${mealTypes[0]}",
      "description": "Brief, appetizing description of a realistic meal",
      "ingredients": [
        {
          "item": "specific common ingredient",
          "quantity": "exact amount with units (150g, 1 cup, 2 tbsp)",
          "serving": "serving description"
        }
      ],
      "macros": {
        "calories": exact_number,
        "protein": exact_number,
        "carbs": exact_number,
        "fat": exact_number
      },
      "instructions": ["simple step 1", "simple step 2", "simple step 3"],
      "cookingTime": "realistic time estimate",
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

CRITICAL: Create meals that look like something you'd order at a restaurant or see in a cookbook. No weird combinations or overly complex recipes.`;

  return basePrompt;
}

function getCookingTimeGuidance(cookingTime: string): string {
  switch (cookingTime) {
    case 'quick':
      return `
COOKING TIME FOCUS: Quick meals (under 15 minutes)
- Prioritize: no-cook items, microwave meals, simple assembly
- Examples: sandwiches, salads, yogurt bowls, scrambled eggs
- Avoid: anything requiring long cooking times`;
    
    case 'medium':
      return `
COOKING TIME FOCUS: Medium prep (15-30 minutes)
- Standard cooking methods: grilling, baking, sautéing
- Examples: grilled chicken, pasta dishes, stir-fries
- Balance between convenience and proper cooking`;
    
    case 'extended':
      return `
COOKING TIME FOCUS: Extended cooking (30+ minutes)
- Allow for slower cooking methods: roasting, braising, slow cooking
- Examples: baked dishes, roasts, soups, casseroles
- Focus on meal prep-friendly options`;
    
    default:
      return `
COOKING TIME: Mix of quick and standard cooking methods
- Prioritize practical, everyday cooking approaches
- Aim for 15-25 minute average prep time`;
  }
}

function getDietaryGuidance(dietary: string): string {
  switch (dietary) {
    case 'vegetarian':
      return `
DIETARY: Vegetarian (no meat, fish, or poultry)
- Protein sources: eggs, dairy, legumes, tofu, tempeh, protein powder
- Focus on complete protein combinations
- Include plenty of vegetables and whole grains`;
    
    case 'vegan':
      return `
DIETARY: Vegan (no animal products)
- Protein sources: tofu, tempeh, legumes, nuts, seeds, plant protein powder
- Use plant-based milk alternatives
- Ensure adequate protein combining`;
    
    case 'gluten-free':
      return `
DIETARY: Gluten-free
- Avoid: wheat, barley, rye, regular pasta, bread
- Use: rice, quinoa, gluten-free oats, corn, potatoes
- Check that all processed ingredients are gluten-free`;
    
    case 'dairy-free':
      return `
DIETARY: Dairy-free
- Avoid: milk, cheese, yogurt, butter
- Use: plant-based alternatives, coconut milk, almond milk
- Focus on naturally dairy-free whole foods`;
    
    default:
      return `
DIETARY: No restrictions
- Use any common ingredients
- Focus on balanced, nutritious whole foods
- Include a variety of protein sources`;
  }
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

    // Convert AI meals to our Meal format
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

      // Add AI-specific data
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
Suggest 5 REALISTIC substitutes for "${ingredient}" that would work in meal planning.
${dietary !== 'all' ? `Must be compatible with ${dietary} diet.` : ''}

Requirements:
- Similar nutritional profile (calories, protein, carbs, fat)
- Easy to find in grocery stores
- Works in similar cooking methods
- Common, recognizable ingredients

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
- Focus on simplicity and realistic home cooking
- Use common cooking methods

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