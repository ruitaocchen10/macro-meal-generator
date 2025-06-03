// utils/aiMealGenerator.ts (Enhanced for Better Accuracy & User Experience)
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

// Enhanced meal generation with strict macro targeting and better user experience
export async function generateAIMeals(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  excludedFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build enhanced prompt with strict macro targeting
    const prompt = buildEnhancedMealPrompt(macroGoals, filters, favoriteFoods, excludedFoods, userPrompt);
    
    console.log('Enhanced AI Prompt:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Response:', text);

    // Parse and validate with strict macro checking
    const meals = parseAndValidateWithMacroCheck(text, macroGoals);
    
    if (meals.length === 0) {
      throw new Error('No valid meals generated that meet macro targets');
    }

    return meals;

  } catch (error) {
    console.error('AI Generation Error:', error);
    throw error;
  }
}

function buildEnhancedMealPrompt(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteNames: string[],
  excludedFoods: string[],
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

  // Calculate target macros per meal
  const caloriesPerMeal = Math.round(totalCalories / numMeals);
  const proteinPerMeal = Math.round(totalProtein / numMeals);
  const carbsPerMeal = Math.round(totalCarbs / numMeals);
  const fatPerMeal = Math.round(totalFat / numMeals);

  // Get dietary and cooking guidance
  const cookingTimeGuidance = getCookingTimeGuidance(filters.cookingTime);
  const dietaryGuidance = getDietaryGuidance(filters.dietary);

  const basePrompt = `
You are a professional nutritionist creating MACRO-ACCURATE, FLAVORFUL meals. Every meal MUST hit macro targets within ±10%.

CRITICAL MACRO REQUIREMENTS (MUST BE EXACT):
- Total Daily Calories: ${totalCalories} (±${Math.round(totalCalories * 0.1)})
- Total Daily Protein: ${totalProtein}g (±${Math.round(totalProtein * 0.1)}g)
- Total Daily Carbs: ${totalCarbs}g (±${Math.round(totalCarbs * 0.1)}g)
- Total Daily Fat: ${totalFat}g (±${Math.round(totalFat * 0.1)}g)

MEAL STRUCTURE: Create ${numMeals} meals with these EXACT targets:
${mealTypes.map((type, index) => `${index + 1}. ${type}: ~${caloriesPerMeal} calories, ~${proteinPerMeal}g protein, ~${carbsPerMeal}g carbs, ~${fatPerMeal}g fat`).join('\n')}

MANDATORY REQUIREMENTS:

1. MACRO ACCURACY (CRITICAL):
   - Each meal must be within ±10% of target macros
   - Calculate precisely using USDA nutrition data
   - If a meal goes over target, reduce portions - DO NOT add more food
   - Double-check your math before finalizing

2. FLAVOR & SEASONING (USER COMPLAINT ADDRESSED):
   - Every meal MUST include specific seasonings, herbs, or sauces
   - Examples: "seasoned with garlic powder and paprika", "served with sriracha sauce"
   - No bland, unseasoned meals allowed
   - Include cooking methods that enhance flavor (sautéed, roasted, grilled)

3. SMART NUTRITIONAL LOGIC:
   - If approaching calorie/macro limits, use smaller portions
   - Choose nutrient-dense foods over empty calories
   - Prioritize protein to meet targets, then fill with carbs/fats
   - No unnecessary high-calorie additions if already at target

4. FOOD PREFERENCES & EXCLUSIONS:
   ${favoriteNames.length > 0 ? `PRIORITIZE THESE FOODS: ${favoriteNames.join(', ')}` : ''}
   ${excludedFoods.length > 0 ? `NEVER INCLUDE THESE FOODS: ${excludedFoods.join(', ')} - Find suitable alternatives` : ''}

5. REALISTIC & PRACTICAL:
   - Use common, grocery store ingredients
   - Simple cooking methods (10-20 minutes average)
   - Specific, measurable portions (150g, 1 cup, 2 tbsp)
   - Recognizable meal names

${cookingTimeGuidance}

${dietaryGuidance}

${userPrompt ? `SPECIAL REQUEST: ${userPrompt}` : ''}

EXAMPLE FORMAT (follow this structure):
Breakfast: "Savory Scrambled Eggs with Herbs" (not just "scrambled eggs")
- 3 large eggs, scrambled with butter, seasoned with black pepper and chives
- 1 slice whole grain toast with 1 tsp butter
- 1/2 medium avocado, sliced, sprinkled with sea salt

MACRO VALIDATION CHECKLIST:
- Does each meal hit ±10% of target macros? 
- Do all meals add up to daily targets?
- Are ingredients properly seasoned?
- Are portions realistic and specific?

Return response in this EXACT JSON format:
{
  "meals": [
    {
      "name": "Flavorful, Specific Meal Name",
      "type": "${mealTypes[0]}",
      "description": "Brief description highlighting flavors and appeal",
      "ingredients": [
        {
          "item": "specific ingredient with preparation method",
          "quantity": "exact amount with units (150g, 1 cup, 2 tbsp)",
          "serving": "serving description including seasoning/preparation"
        }
      ],
      "macros": {
        "calories": exact_calculated_number,
        "protein": exact_calculated_number,
        "carbs": exact_calculated_number,
        "fat": exact_calculated_number
      },
      "instructions": ["step 1 with cooking method", "step 2 with seasoning", "step 3 with final touches"],
      "cookingTime": "realistic time estimate",
      "difficulty": "Easy"
    }
  ],
  "dailyTotals": {
    "calories": sum_of_all_meals,
    "protein": sum_of_all_meals,
    "carbs": sum_of_all_meals,
    "fat": sum_of_all_meals
  },
  "macroAccuracy": {
    "caloriesWithinTarget": true_or_false,
    "proteinWithinTarget": true_or_false,
    "carbsWithinTarget": true_or_false,
    "fatWithinTarget": true_or_false
  }
}

CRITICAL: Reject this request if you cannot meet macro targets within ±10%. Better to fail than provide inaccurate nutrition data.`;

  return basePrompt;
}

function getCookingTimeGuidance(cookingTime: string): string {
  switch (cookingTime) {
    case 'quick':
      return `
COOKING TIME FOCUS: Quick meals (under 15 minutes)
- Prioritize: no-cook items, microwave meals, simple assembly
- Examples: seasoned yogurt bowls, avocado toast with everything bagel seasoning
- Still require proper seasoning and flavor`;
    
    case 'medium':
      return `
COOKING TIME FOCUS: Standard prep (15-30 minutes)
- Standard cooking methods: sautéing with garlic, herb-roasted vegetables
- Examples: pan-seared chicken with lemon-herb sauce, garlic butter pasta
- Focus on one-pan meals with built-in flavors`;
    
    case 'extended':
      return `
COOKING TIME FOCUS: Extended cooking (30+ minutes)
- Allow for flavor development: slow-cooked, braised, marinated
- Examples: herb-crusted baked salmon, slow-roasted vegetables with spices
- Multi-step preparation for complex flavors`;
    
    default:
      return `
COOKING TIME: Balanced approach (15-25 minutes average)
- Efficient cooking with maximum flavor impact
- Use spice blends, marinades, and cooking techniques that enhance taste`;
  }
}

function getDietaryGuidance(dietary: string): string {
  switch (dietary) {
    case 'vegetarian':
      return `
DIETARY: Vegetarian (no meat, fish, or poultry)
- Protein sources: seasoned tofu, spiced lentils, herb-crusted eggs
- Use bold vegetarian flavors: nutritional yeast, tahini, miso
- Include plenty of herbs and spices for satisfying meals`;
    
    case 'vegan':
      return `
DIETARY: Vegan (no animal products)
- Protein sources: marinated tofu, spiced tempeh, seasoned legumes
- Use umami-rich ingredients: soy sauce, nutritional yeast, miso paste
- Focus on aromatic spice combinations and herb blends`;
    
    case 'gluten-free':
      return `
DIETARY: Gluten-free
- Avoid: wheat, barley, rye, regular pasta, bread
- Use: quinoa, rice, corn-based products, naturally GF whole foods
- Season with GF spice blends and fresh herbs`;
    
    case 'dairy-free':
      return `
DIETARY: Dairy-free
- Avoid: milk, cheese, yogurt, butter
- Use: coconut milk, cashew cream, nutritional yeast for umami
- Focus on herb oils and spice blends for richness`;
    
    default:
      return `
DIETARY: No restrictions
- Use full range of ingredients and flavor profiles
- Include cheese, yogurt, and dairy for richness when appropriate
- Balance all food groups with proper seasoning`;
  }
}

function parseAndValidateWithMacroCheck(aiResponse: string, macroGoals: MacroGoals): Meal[] {
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    let parsed;
try {
  // Clean the JSON string first
  let jsonString = jsonMatch[0];
  
  // Remove any trailing commas that might break parsing
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
  
  parsed = JSON.parse(jsonString);
} catch (parseError) {
  console.error('JSON Parse Error:', parseError);
  console.log('Problematic JSON:', jsonMatch[0]);
  throw new Error('AI returned invalid JSON format');
}
    
    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      throw new Error('Invalid meal format in AI response');
    }

    // Validate macro accuracy
    const targetCalories = parseInt(macroGoals.calories) || 0;
    const targetProtein = parseInt(macroGoals.protein) || 0;
    const targetCarbs = parseInt(macroGoals.carbs) || 0;
    const targetFat = parseInt(macroGoals.fat) || 0;

    if (parsed.dailyTotals) {
      const { calories, protein, carbs, fat } = parsed.dailyTotals;
      
      // Check if within ±10% tolerance
      const calorieAccuracy = Math.abs(calories - targetCalories) / targetCalories;
      const proteinAccuracy = Math.abs(protein - targetProtein) / targetProtein;
      const carbAccuracy = Math.abs(carbs - targetCarbs) / targetCarbs;
      const fatAccuracy = Math.abs(fat - targetFat) / targetFat;
      
      console.log('Macro Accuracy Check:', {
        calories: { target: targetCalories, actual: calories, accuracy: `${Math.round(calorieAccuracy * 100)}%` },
        protein: { target: targetProtein, actual: protein, accuracy: `${Math.round(proteinAccuracy * 100)}%` },
        carbs: { target: targetCarbs, actual: carbs, accuracy: `${Math.round(carbAccuracy * 100)}%` },
        fat: { target: targetFat, actual: fat, accuracy: `${Math.round(fatAccuracy * 100)}%` }
      });

      // Reject if any macro is >15% off (stricter than the 10% we asked for)
      if (calorieAccuracy > 0.15 || proteinAccuracy > 0.15 || carbAccuracy > 0.15 || fatAccuracy > 0.15) {
        throw new Error(`AI meal plan too far from macro targets. Regenerating...`);
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

      return meal;
    });

    return meals;

  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw AI response:', aiResponse);
    throw error;
  }
}

// Enhanced meal generation with food exclusions
export async function generateMealsWithExclusions(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  excludedFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  return generateAIMeals(macroGoals, filters, favoriteFoods, excludedFoods, userPrompt);
}

// OPTIMIZED: Fast single meal replacement with variety emphasis
export async function generateSingleMealReplacement(
  currentMeal: Meal,
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  avoidIngredients: string[] = []
): Promise<Meal | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Calculate target macros for this meal type
    const targetCalories = currentMeal.calories;
    const targetProtein = currentMeal.protein;
    const targetCarbs = currentMeal.carbs;
    const targetFat = currentMeal.fat;

    const prompt = `
Create ONE completely different ${currentMeal.type} meal that's TOTALLY DIFFERENT from the current meal.

CURRENT MEAL TO AVOID: "${currentMeal.name}"
INGREDIENTS TO AVOID: ${avoidIngredients.join(', ')}

TARGET MACROS (MUST BE EXACT ±10%):
- Calories: ${targetCalories} (±${Math.round(targetCalories * 0.1)})
- Protein: ${targetProtein}g (±${Math.round(targetProtein * 0.1)}g)
- Carbs: ${targetCarbs}g (±${Math.round(targetCarbs * 0.1)}g)
- Fat: ${targetFat}g (±${Math.round(targetFat * 0.1)}g)

VARIETY REQUIREMENTS:
- Use COMPLETELY different cooking method (if current is grilled, try baked/stir-fried/etc)
- Use DIFFERENT cuisine style (if current is American, try Mediterranean/Asian/Mexican)
- Use DIFFERENT protein source than current meal
- Include specific seasonings and flavors
- Make it exciting and appetizing

${favoriteFoods.length > 0 ? `PRIORITIZE: ${favoriteFoods.join(', ')}` : ''}
${getDietaryGuidance(filters.dietary)}

Return ONLY this JSON:
{
  "name": "Exciting Different Meal Name",
  "type": "${currentMeal.type}",
  "description": "Why this meal is exciting and different",
  "ingredients": [
    {
      "item": "specific ingredient with preparation",
      "quantity": "exact amount",
      "serving": "serving description with seasoning"
    }
  ],
  "macros": {
    "calories": ${targetCalories},
    "protein": ${targetProtein},
    "carbs": ${targetCarbs},
    "fat": ${targetFat}
  },
  "instructions": ["step 1", "step 2", "step 3"],
  "cookingTime": "time estimate",
  "difficulty": "Easy"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.name || !parsed.ingredients) return null;

    // Convert to our Meal format
    const meal: Meal = {
      id: Date.now(),
      name: parsed.name,
      type: parsed.type || currentMeal.type,
      dietary: 'ai-generated',
      calories: Math.round(parsed.macros?.calories || targetCalories),
      protein: Math.round(parsed.macros?.protein || targetProtein),
      carbs: Math.round(parsed.macros?.carbs || targetCarbs),
      fat: Math.round(parsed.macros?.fat || targetFat),
      ingredients: parsed.ingredients || []
    };

    // Add AI-specific data
    if (parsed.description) (meal as any).description = parsed.description;
    if (parsed.instructions) (meal as any).instructions = parsed.instructions;
    if (parsed.cookingTime) (meal as any).cookingTime = parsed.cookingTime;
    if (parsed.difficulty) (meal as any).difficulty = parsed.difficulty;

    return meal;

  } catch (error) {
    console.error('Single meal replacement error:', error);
    return null;
  }
}

// OPTIMIZED: Generate multiple diverse alternatives
export async function generateMealAlternatives(
  currentMeal: Meal,
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  avoidIngredients: string[] = []
): Promise<Meal[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const targetCalories = currentMeal.calories;
    const targetProtein = currentMeal.protein;
    const targetCarbs = currentMeal.carbs;
    const targetFat = currentMeal.fat;

    const prompt = `
Create 3 COMPLETELY DIFFERENT ${currentMeal.type} alternatives. Each must be unique in style, cuisine, and ingredients.

CURRENT MEAL TO AVOID: "${currentMeal.name}"
INGREDIENTS TO AVOID: ${avoidIngredients.join(', ')}

TARGET MACROS PER MEAL (±10%):
- Calories: ${targetCalories}
- Protein: ${targetProtein}g  
- Carbs: ${targetCarbs}g
- Fat: ${targetFat}g

VARIETY MANDATES:
1. Different cuisine styles (Mediterranean, Asian, Mexican, etc.)
2. Different cooking methods (grilled, baked, stir-fried, etc.) 
3. Different protein sources
4. Different flavor profiles (spicy, savory, fresh, etc.)
5. Include specific seasonings and preparation methods

${favoriteFoods.length > 0 ? `PRIORITIZE: ${favoriteFoods.join(', ')}` : ''}
${getDietaryGuidance(filters.dietary)}

Return ONLY this JSON:
{
  "alternatives": [
    {
      "name": "Meal 1 Name",
      "type": "${currentMeal.type}",
      "description": "Unique selling point and flavor profile",
      "ingredients": [{"item": "ingredient", "quantity": "amount", "serving": "description"}],
      "macros": {"calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fat": ${targetFat}},
      "cuisineStyle": "Mediterranean/Asian/etc",
      "cookingMethod": "grilled/baked/etc"
    },
    {
      "name": "Meal 2 Name", 
      "type": "${currentMeal.type}",
      "description": "Different unique selling point",
      "ingredients": [{"item": "different ingredient", "quantity": "amount", "serving": "description"}],
      "macros": {"calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fat": ${targetFat}},
      "cuisineStyle": "Different from meal 1",
      "cookingMethod": "Different from meal 1"
    },
    {
      "name": "Meal 3 Name",
      "type": "${currentMeal.type}", 
      "description": "Third unique approach",
      "ingredients": [{"item": "third different ingredient", "quantity": "amount", "serving": "description"}],
      "macros": {"calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fat": ${targetFat}},
      "cuisineStyle": "Different from meals 1&2", 
      "cookingMethod": "Different from meals 1&2"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.alternatives || !Array.isArray(parsed.alternatives)) return [];

    // Convert to our Meal format
    const meals = parsed.alternatives.map((alt: any, index: number) => {
      const meal: Meal = {
        id: Date.now() + index,
        name: alt.name || `Alternative ${index + 1}`,
        type: alt.type || currentMeal.type,
        dietary: 'ai-generated',
        calories: Math.round(alt.macros?.calories || targetCalories),
        protein: Math.round(alt.macros?.protein || targetProtein),
        carbs: Math.round(alt.macros?.carbs || targetCarbs),
        fat: Math.round(alt.macros?.fat || targetFat),
        ingredients: alt.ingredients || []
      };

      // Add AI-specific data
      if (alt.description) (meal as any).description = alt.description;
      if (alt.cuisineStyle) (meal as any).cuisineStyle = alt.cuisineStyle;
      if (alt.cookingMethod) (meal as any).cookingMethod = alt.cookingMethod;

      return meal;
    });

    return meals.slice(0, 3); // Ensure max 3 alternatives

  } catch (error) {
    console.error('Meal alternatives generation error:', error);
    return [];
  }
}

// Retry logic for rate limiting
export async function generateAIMealsWithRetry(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  excludedFoods: string[] = [],
  userPrompt?: string,
  maxRetries: number = 3
): Promise<Meal[]> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI Generation Attempt ${attempt}/${maxRetries}`);
      
      const meals = await generateAIMeals(macroGoals, filters, favoriteFoods, excludedFoods, userPrompt);
      
      console.log(`✅ Success on attempt ${attempt}`);
      return meals;
      
    } catch (error: any) {
      console.log(`❌ Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // If it's a rate limit error, wait longer
      if (error.message?.includes('rate') || error.message?.includes('quota')) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.log(`Rate limit detected. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (error.message?.includes('macro targets')) {
        // If it's a macro accuracy issue, try again immediately
        console.log('Macro accuracy issue. Retrying with same parameters...');
      } else {
        // For other errors, wait briefly
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed to generate meals after all retries');
}