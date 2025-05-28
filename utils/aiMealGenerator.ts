// utils/aiMealGenerator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MacroGoals, Filters, Meal } from '../types';
import { foodDatabase, getFoodById } from './foodDatabase';

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

export async function generateAIMeals(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Get favorite food names for context
    const favoriteNames = favoriteFoods
      .map(id => getFoodById(id)?.name)
      .filter(Boolean)
      .join(', ');

    // Build the prompt
    const prompt = buildMealGenerationPrompt(macroGoals, filters, favoriteNames, userPrompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response and convert to our Meal format
    return parseAIResponse(text, macroGoals);

  } catch (error) {
    console.error('Error generating AI meals:', error);
    // Fallback to our existing meal generator
    const { generateMeals } = await import('./smartMealGenerator');
    return generateMeals(macroGoals, filters, favoriteFoods);
  }
}

function buildMealGenerationPrompt(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteNames: string,
  userPrompt?: string
): string {
  const basePrompt = `
Create a daily meal plan with the following requirements:

MACRO TARGETS:
- Calories: ${macroGoals.calories || 'flexible'}
- Protein: ${macroGoals.protein}g
- Carbs: ${macroGoals.carbs}g  
- Fat: ${macroGoals.fat}g

DIETARY PREFERENCES:
- Restriction: ${filters.dietary === 'all' ? 'None' : filters.dietary}
- Meal focus: ${filters.mealType === 'all' ? 'Balanced distribution' : filters.mealType}

FAVORITE FOODS (prioritize these):
${favoriteNames || 'No specific preferences'}

${userPrompt ? `SPECIAL REQUEST: ${userPrompt}` : ''}

Please create 3-5 meals that:
1. Hit the macro targets as closely as possible
2. Use favorite foods when specified
3. Are realistic and tasty
4. Include proper portion sizes
5. Are varied and interesting

Return the response in this exact JSON format:
{
  "meals": [
    {
      "name": "Meal Name",
      "type": "breakfast|lunch|dinner|snack",
      "description": "Brief description",
      "ingredients": [
        {
          "item": "ingredient name",
          "quantity": "amount (e.g., 1.5x, 200g)",
          "serving": "serving description"
        }
      ],
      "macros": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      },
      "instructions": ["step 1", "step 2"],
      "cookingTime": "15 minutes",
      "difficulty": "Easy"
    }
  ]
}`;

  return basePrompt;
}

function parseAIResponse(aiResponse: string, macroGoals: MacroGoals): Meal[] {
  try {
    // Extract JSON from the response (AI might include extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      throw new Error('Invalid meal format');
    }

    // Convert AI meals to our Meal format
    return parsed.meals.map((aiMeal: any, index: number) => ({
      id: index + 1,
      name: aiMeal.name || 'AI Generated Meal',
      type: aiMeal.type || 'meal',
      dietary: 'ai-generated',
      calories: aiMeal.macros?.calories || 400,
      protein: aiMeal.macros?.protein || 25,
      carbs: aiMeal.macros?.carbs || 30,
      fat: aiMeal.macros?.fat || 15,
      ingredients: aiMeal.ingredients || [],
      // Store additional AI data
      description: aiMeal.description,
      instructions: aiMeal.instructions,
      cookingTime: aiMeal.cookingTime,
      difficulty: aiMeal.difficulty
    }));

  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw error;
  }
}

// Enhanced meal generation with natural language
export async function generateMealsWithPrompt(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  userPrompt: string
): Promise<Meal[]> {
  return generateAIMeals(macroGoals, filters, favoriteFoods, userPrompt);
}

// Smart ingredient substitution
export async function suggestIngredientSubstitutes(
  ingredient: string,
  dietary: string = 'all'
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
Suggest 5 healthy substitutes for "${ingredient}" that would work in meal planning.
${dietary !== 'all' ? `Must be compatible with ${dietary} diet.` : ''}

Return just a comma-separated list of alternatives, no extra text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.split(',').map(item => item.trim());
  } catch (error) {
    console.error('Error getting substitutes:', error);
    return [];
  }
}

// Recipe enhancement
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

Return 5-8 clear, concise cooking steps. Each step should be one sentence.
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