// utils/aiMealGenerator.ts - Updated for Flexible Meal/Snack System
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MacroGoals, Filters, Meal, generateMealStructure } from '../types';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');

export interface AIGeneratedMeal {
  name: string;
  type: string;
  category: 'meal' | 'snack';
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
  excludedFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildFlexibleMealPrompt(macroGoals, filters, favoriteFoods, excludedFoods, userPrompt);
    
    console.log('Enhanced AI Prompt with Flexible Structure:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('AI Response:', text);

    const meals = parseAndValidateWithFlexibleStructure(text, macroGoals, filters.mealConfiguration);
    
    if (meals.length === 0) {
      throw new Error('No valid meals generated that meet meal configuration and macro targets');
    }

    return meals;

  } catch (error) {
    console.error('AI Generation Error:', error);
    throw error;
  }
}

function buildFlexibleMealPrompt(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteNames: string[],
  excludedFoods: string[],
  userPrompt?: string
): string {
  const totalCalories = parseInt(macroGoals.calories) || 2000;
  const totalProtein = parseInt(macroGoals.protein) || 150;
  const totalCarbs = parseInt(macroGoals.carbs) || 200;
  const totalFat = parseInt(macroGoals.fat) || 65;

  // Generate meal structure from configuration
  const mealStructure = generateMealStructure(
    filters.mealConfiguration.mealCount, 
    filters.mealConfiguration.snackCount
  );
  
  // Calculate target macros for each meal based on calorie percentage
  const mealTargets = mealStructure.mealTypes.map(mealType => {
    const calorieTarget = Math.round(totalCalories * (mealType.caloriePercentage / 100));
    const proteinTarget = Math.round(totalProtein * (mealType.caloriePercentage / 100));
    const carbsTarget = Math.round(totalCarbs * (mealType.caloriePercentage / 100));
    const fatTarget = Math.round(totalFat * (mealType.caloriePercentage / 100));
    
    return {
      ...mealType,
      calories: calorieTarget,
      protein: proteinTarget,
      carbs: carbsTarget,
      fat: fatTarget
    };
  });

  const dietaryGuidance = getDietaryGuidance(filters.dietary);

  const basePrompt = `
You are a professional nutritionist creating MACRO-ACCURATE meals with a flexible meal structure. Generate exactly ${mealStructure.totalItems} meals/snacks following this precise structure.

CRITICAL MACRO REQUIREMENTS (MUST BE EXACT):
- Total Daily Calories: ${totalCalories} (±${Math.round(totalCalories * 0.1)})
- Total Daily Protein: ${totalProtein}g (±${Math.round(totalProtein * 0.1)}g)
- Total Daily Carbs: ${totalCarbs}g (±${Math.round(totalCarbs * 0.1)}g)
- Total Daily Fat: ${totalFat}g (±${Math.round(totalFat * 0.1)}g)

MANDATORY MEAL STRUCTURE - Create these EXACT items in this order:
${mealTargets.map((meal, index) => `
${index + 1}. ${meal.name} (${meal.category.toUpperCase()})
   - Type: "${meal.type}"
   - Category: "${meal.category}"
   - Target: ${meal.calories} cal, ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat
   - Portion Guidelines: ${meal.category === 'meal' ? 'Full meal with multiple components' : 'Simple snack, 1-3 ingredients max'}`).join('')}

MEAL vs SNACK REQUIREMENTS:

🍽️ MEALS (${filters.mealConfiguration.mealCount} total):
- 3-5 diverse ingredients
- Complete nutritional profile
- Cooking involved (5-20 minutes)
- Satisfying and filling
- Examples: "Herb-Crusted Salmon with Roasted Vegetables", "Mediterranean Chicken Bowl"

🥨 SNACKS (${filters.mealConfiguration.snackCount} total):
- 1-3 simple ingredients MAX
- Quick preparation (under 5 minutes)
- Portable and convenient
- Focus on protein + one other macro
- Examples: "Greek Yogurt with Berries", "Almonds and Apple Slices", "Protein Smoothie"

MANDATORY MEASUREMENT RULES:
- Use common US measurements only (cups, tablespoons, ounces, pieces)
- NO metric measurements (grams, kilograms)
- Specific portions: "4 oz chicken", "1 cup rice", "2 tbsp olive oil"

FLAVOR & PREPARATION REQUIREMENTS:
- Every item must include specific seasonings/preparation
- NO bland, unseasoned food
- Include cooking methods that enhance flavor
- Examples: "seasoned with garlic powder", "sautéed with herbs", "grilled with lemon"

FOOD PREFERENCES & EXCLUSIONS:
${favoriteNames.length > 0 ? `PRIORITIZE THESE FOODS: ${favoriteNames.join(', ')}` : ''}
${excludedFoods.length > 0 ? `NEVER INCLUDE THESE FOODS: ${excludedFoods.join(', ')} - Find suitable alternatives` : ''}

${dietaryGuidance}

${userPrompt ? `SPECIAL REQUEST: ${userPrompt}` : ''}

CRITICAL SNACK EXAMPLES (for reference):
- "Greek Yogurt with Mixed Berries" (1 cup Greek yogurt, 1/2 cup berries)
- "Almond Butter Apple Slices" (1 medium apple, 2 tbsp almond butter)
- "Protein Smoothie" (1 scoop protein powder, 1 cup almond milk, 1/2 banana)
- "Cottage Cheese Bowl" (1/2 cup cottage cheese, 1/4 cup granola)

Return response in this EXACT JSON format:
{
  "meals": [
    {
      "name": "Specific Meal/Snack Name",
      "type": "${mealTargets[0]?.type || 'breakfast'}",
      "category": "${mealTargets[0]?.category || 'meal'}",
      "description": "Brief description highlighting why it fits this meal type",
      "ingredients": [
        {
          "item": "specific ingredient with preparation method",
          "quantity": "exact amount with US units",
          "serving": "serving description including seasoning/preparation"
        }
      ],
      "macros": {
        "calories": exact_calculated_number,
        "protein": exact_calculated_number,
        "carbs": exact_calculated_number,
        "fat": exact_calculated_number
      },
      "instructions": ["step 1", "step 2", "step 3"],
      "cookingTime": "${mealTargets[0]?.category === 'snack' ? 'Under 5 minutes' : '10-20 minutes'}",
      "difficulty": "Easy"
    }
  ],
  "dailyTotals": {
    "calories": sum_of_all_meals,
    "protein": sum_of_all_meals,
    "carbs": sum_of_all_meals,
    "fat": sum_of_all_meals
  },
  "configurationCompliance": {
    "correctItemCount": true_or_false,
    "correctMealTypes": true_or_false,
    "appropriatePortioning": true_or_false
  }
}

CRITICAL SUCCESS CRITERIA:
1. Exactly ${mealStructure.totalItems} meals/snacks generated
2. Each meal matches its assigned type and category
3. Snacks are simple (1-3 ingredients), meals are complete (3-5 ingredients)
4. Daily totals within ±10% of macro targets
5. All portions realistic and properly seasoned

REJECT if you cannot meet these exact meal structure requirements.`;

  return basePrompt;
}

function getDietaryGuidance(dietary: string): string {
  switch (dietary) {
    case 'vegetarian':
      return `
DIETARY: Vegetarian (no meat, fish, or poultry)
- Meal proteins: seasoned tofu, herb-crusted eggs, lentil dishes
- Snack proteins: Greek yogurt, cottage cheese, nuts, protein powder
- Use bold vegetarian flavors: nutritional yeast, tahini, herbs`;
    
    case 'vegan':
      return `
DIETARY: Vegan (no animal products)
- Meal proteins: marinated tofu, spiced tempeh, seasoned legumes
- Snack proteins: plant protein powder, nuts, seeds, hummus
- Focus on umami-rich ingredients: nutritional yeast, soy sauce, miso`;
    
    case 'gluten-free':
      return `
DIETARY: Gluten-free
- Avoid: wheat, barley, rye, regular pasta, bread
- Use: quinoa, rice, corn-based products, naturally GF foods
- Snacks: naturally GF options like fruits, nuts, yogurt`;
    
    case 'dairy-free':
      return `
DIETARY: Dairy-free
- Avoid: milk, cheese, yogurt, butter
- Meal alternatives: coconut milk, cashew cream, nutritional yeast
- Snack alternatives: plant-based yogurts, nuts, dairy-free smoothies`;
    
    default:
      return `
DIETARY: No restrictions
- Use full range of ingredients and flavor profiles
- Include dairy, meat, fish for complete nutrition options
- Balance all food groups with proper seasoning`;
  }
}

function parseAndValidateWithFlexibleStructure(aiResponse: string, macroGoals: MacroGoals, mealConfiguration: any): Meal[] {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    let parsed;
    try {
      let jsonString = jsonMatch[0];
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('AI returned invalid JSON format');
    }
    
    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      throw new Error('Invalid meal format in AI response');
    }

    // Validate meal configuration compliance
    const expectedTotal = mealConfiguration.mealCount + mealConfiguration.snackCount;
    if (parsed.meals.length !== expectedTotal) {
      throw new Error(`Expected ${expectedTotal} items, got ${parsed.meals.length}`);
    }

    // Generate expected structure for validation
    const expectedStructure = generateMealStructure(mealConfiguration.mealCount, mealConfiguration.snackCount);

    // Validate each meal matches expected structure
    for (let i = 0; i < parsed.meals.length; i++) {
      const aiMeal = parsed.meals[i];
      const expectedItem = expectedStructure.mealTypes[i];
      
      if (aiMeal.category !== expectedItem.category) {
        console.warn(`Item ${i + 1} category mismatch: expected ${expectedItem.category}, got ${aiMeal.category}`);
      }
    }

    // Validate macro accuracy
    const targetCalories = parseInt(macroGoals.calories) || 0;
    const targetProtein = parseInt(macroGoals.protein) || 0;
    const targetCarbs = parseInt(macroGoals.carbs) || 0;
    const targetFat = parseInt(macroGoals.fat) || 0;

    if (parsed.dailyTotals) {
      const { calories, protein, carbs, fat } = parsed.dailyTotals;
      
      const calorieAccuracy = Math.abs(calories - targetCalories) / targetCalories;
      const proteinAccuracy = Math.abs(protein - targetProtein) / targetProtein;
      const carbAccuracy = Math.abs(carbs - targetCarbs) / targetCarbs;
      const fatAccuracy = Math.abs(fat - targetFat) / targetFat;
      
      console.log('Flexible Structure & Macro Accuracy Check:', {
        mealCount: { expected: mealConfiguration.mealCount, actual: parsed.meals.filter((m: any) => m.category === 'meal').length },
        snackCount: { expected: mealConfiguration.snackCount, actual: parsed.meals.filter((m: any) => m.category === 'snack').length },
        calories: { target: targetCalories, actual: calories, accuracy: `${Math.round(calorieAccuracy * 100)}%` },
        protein: { target: targetProtein, actual: protein, accuracy: `${Math.round(proteinAccuracy * 100)}%` },
        carbs: { target: targetCarbs, actual: carbs, accuracy: `${Math.round(carbAccuracy * 100)}%` },
        fat: { target: targetFat, actual: fat, accuracy: `${Math.round(fatAccuracy * 100)}%` }
      });

      if (calorieAccuracy > 0.15 || proteinAccuracy > 0.15 || carbAccuracy > 0.15 || fatAccuracy > 0.15) {
        throw new Error(`AI meal plan too far from macro targets. Regenerating...`);
      }
    }

    // Convert AI meals to our Meal format with flexible structure info
    const meals = parsed.meals.map((aiMeal: any, index: number) => {
      const expectedItem = expectedStructure.mealTypes[index];
      
      const meal: Meal = {
        id: index + 1,
        name: aiMeal.name || `${expectedItem.name} ${index + 1}`,
        type: aiMeal.type || expectedItem.type,
        category: aiMeal.category || expectedItem.category,
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
    console.error('Error parsing AI response with flexible structure:', error);
    console.log('Raw AI response:', aiResponse);
    throw error;
  }
}

// Enhanced single meal replacement with flexible structure awareness
export async function generateSingleMealReplacement(
  currentMeal: Meal,
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  avoidIngredients: string[] = []
): Promise<Meal | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const targetCalories = currentMeal.calories;
    const targetProtein = currentMeal.protein;
    const targetCarbs = currentMeal.carbs;
    const targetFat = currentMeal.fat;

    // Determine if this is a meal or snack for appropriate sizing
    const isMeal = currentMeal.category === 'meal';
    const ingredientGuidance = isMeal 
      ? '3-5 diverse ingredients with complete nutrition'
      : '1-3 simple ingredients, quick preparation';

    const prompt = `
Create ONE completely different ${currentMeal.type} ${currentMeal.category} that's TOTALLY DIFFERENT from the current one.

CURRENT ${currentMeal.category.toUpperCase()} TO AVOID: "${currentMeal.name}"
INGREDIENTS TO AVOID: ${avoidIngredients.join(', ')}

TARGET MACROS (MUST BE EXACT ±10%):
- Calories: ${targetCalories} (±${Math.round(targetCalories * 0.1)})
- Protein: ${targetProtein}g (±${Math.round(targetProtein * 0.1)}g)
- Carbs: ${targetCarbs}g (±${Math.round(targetCarbs * 0.1)}g)
- Fat: ${targetFat}g (±${Math.round(targetFat * 0.1)}g)

${currentMeal.category === 'meal' ? `
MEAL REQUIREMENTS:
- ${ingredientGuidance}
- Include cooking/preparation steps
- Complete nutritional profile
- Satisfying and filling
- Examples: "Mediterranean Chicken Bowl", "Asian Stir-Fry with Brown Rice"
` : `
SNACK REQUIREMENTS:
- ${ingredientGuidance}
- Under 5 minutes preparation
- Portable and convenient
- Examples: "Greek Yogurt with Berries", "Apple with Almond Butter", "Protein Smoothie"
`}

VARIETY REQUIREMENTS:
- Use COMPLETELY different cooking method
- Use DIFFERENT cuisine style
- Use DIFFERENT primary ingredients
- Include specific seasonings and flavors
- Make it exciting and appetizing

${favoriteFoods.length > 0 ? `PRIORITIZE: ${favoriteFoods.join(', ')}` : ''}
${getDietaryGuidance(filters.dietary)}

Return ONLY this JSON:
{
  "name": "Exciting Different ${currentMeal.category} Name",
  "type": "${currentMeal.type}",
  "category": "${currentMeal.category}",
  "description": "Why this ${currentMeal.category} is exciting and different",
  "ingredients": [
    {
      "item": "specific ingredient with preparation",
      "quantity": "exact US measurement",
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
  "cookingTime": "${isMeal ? '10-20 minutes' : 'Under 5 minutes'}",
  "difficulty": "Easy"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.name || !parsed.ingredients) return null;

    const meal: Meal = {
      id: Date.now(),
      name: parsed.name,
      type: parsed.type || currentMeal.type,
      category: parsed.category || currentMeal.category,
      dietary: 'ai-generated',
      calories: Math.round(parsed.macros?.calories || targetCalories),
      protein: Math.round(parsed.macros?.protein || targetProtein),
      carbs: Math.round(parsed.macros?.carbs || targetCarbs),
      fat: Math.round(parsed.macros?.fat || targetFat),
      ingredients: parsed.ingredients || []
    };

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

// Generate meal alternatives with flexible structure awareness
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

    const isMeal = currentMeal.category === 'meal';
    const categoryGuidance = isMeal 
      ? 'Complete meals with 3-5 ingredients, cooking involved'
      : 'Simple snacks with 1-3 ingredients, quick prep';

    const prompt = `
Create 3 COMPLETELY DIFFERENT ${currentMeal.type} ${currentMeal.category} alternatives. Each must be unique in style, cuisine, and ingredients.

CURRENT ${currentMeal.category.toUpperCase()} TO AVOID: "${currentMeal.name}"
INGREDIENTS TO AVOID: ${avoidIngredients.join(', ')}

TARGET MACROS PER ${currentMeal.category.toUpperCase()} (±10%):
- Calories: ${targetCalories}
- Protein: ${targetProtein}g  
- Carbs: ${targetCarbs}g
- Fat: ${targetFat}g

${currentMeal.category.toUpperCase()} REQUIREMENTS:
- ${categoryGuidance}
- Each alternative must be completely different from others
- Use different primary ingredients in each
- Include specific seasonings and preparation methods

VARIETY MANDATES:
1. Different cuisine styles (Mediterranean, Asian, Mexican, etc.)
2. Different cooking methods (grilled, baked, raw, etc.) 
3. Different protein sources
4. Different flavor profiles (spicy, savory, fresh, etc.)

${favoriteFoods.length > 0 ? `PRIORITIZE: ${favoriteFoods.join(', ')}` : ''}
${getDietaryGuidance(filters.dietary)}

Return ONLY this JSON:
{
  "alternatives": [
    {
      "name": "${currentMeal.category} 1 Name",
      "type": "${currentMeal.type}",
      "category": "${currentMeal.category}",
      "description": "Unique selling point and flavor profile",
      "ingredients": [{"item": "ingredient", "quantity": "US measurement", "serving": "description"}],
      "macros": {"calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fat": ${targetFat}},
      "cuisineStyle": "Mediterranean/Asian/etc",
      "cookingMethod": "grilled/raw/etc"
    },
    {
      "name": "${currentMeal.category} 2 Name", 
      "type": "${currentMeal.type}",
      "category": "${currentMeal.category}",
      "description": "Different unique selling point",
      "ingredients": [{"item": "different ingredient", "quantity": "measurement", "serving": "description"}],
      "macros": {"calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fat": ${targetFat}},
      "cuisineStyle": "Different from option 1",
      "cookingMethod": "Different from option 1"
    },
    {
      "name": "${currentMeal.category} 3 Name",
      "type": "${currentMeal.type}",
      "category": "${currentMeal.category}",
      "description": "Third unique approach",
      "ingredients": [{"item": "third different ingredient", "quantity": "measurement", "serving": "description"}],
      "macros": {"calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fat": ${targetFat}},
      "cuisineStyle": "Different from options 1&2", 
      "cookingMethod": "Different from options 1&2"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.alternatives || !Array.isArray(parsed.alternatives)) return [];

    const meals = parsed.alternatives.map((alt: any, index: number) => {
      const meal: Meal = {
        id: Date.now() + index,
        name: alt.name || `Alternative ${index + 1}`,
        type: alt.type || currentMeal.type,
        category: alt.category || currentMeal.category,
        dietary: 'ai-generated',
        calories: Math.round(alt.macros?.calories || targetCalories),
        protein: Math.round(alt.macros?.protein || targetProtein),
        carbs: Math.round(alt.macros?.carbs || targetCarbs),
        fat: Math.round(alt.macros?.fat || targetFat),
        ingredients: alt.ingredients || []
      };

      if (alt.description) (meal as any).description = alt.description;
      if (alt.cuisineStyle) (meal as any).cuisineStyle = alt.cuisineStyle;
      if (alt.cookingMethod) (meal as any).cookingMethod = alt.cookingMethod;

      return meal;
    });

    return meals.slice(0, 3);

  } catch (error) {
    console.error('Meal alternatives generation error:', error);
    return [];
  }
}