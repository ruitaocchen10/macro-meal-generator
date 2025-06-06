// utils/aiMealGenerator.ts - Enhanced with Nutrition Accuracy
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

// Nutrition validation function
function validateNutritionMath(meal: any): { isValid: boolean; calculatedCalories: number; error?: string } {
  if (!meal.macros) {
    return { isValid: false, calculatedCalories: 0, error: 'Missing macros' };
  }
  
  const { protein, carbs, fat, calories } = meal.macros;
  const calculatedCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
  const difference = Math.abs(calculatedCalories - calories);
  const tolerance = Math.max(calories * 0.15, 20); // 15% tolerance or 20 calories, whichever is higher
  
  if (difference > tolerance) {
    return {
      isValid: false,
      calculatedCalories,
      error: `Nutrition math error: Reported ${calories} cal, calculated ${calculatedCalories} cal (difference: ${difference})`
    };
  }
  
  return { isValid: true, calculatedCalories };
}

// Check for realistic calorie density
function validateCalorieDensity(meal: any): { isValid: boolean; error?: string } {
  const calories = meal.macros?.calories || 0;
  
  // Basic sanity checks
  if (calories < 50) {
    return { isValid: false, error: 'Unrealistically low calories' };
  }
  
  if (calories > 1500 && meal.category === 'snack') {
    return { isValid: false, error: 'Snack calories too high (>1500)' };
  }
  
  if (calories > 2000 && meal.category === 'meal') {
    return { isValid: false, error: 'Meal calories too high (>2000)' };
  }
  
  return { isValid: true };
}

export async function generateAIMeals(
  macroGoals: MacroGoals,
  filters: Filters,
  favoriteFoods: string[] = [],
  excludedFoods: string[] = [],
  userPrompt?: string
): Promise<Meal[]> {
  try {
    console.log('API Key exists:', !!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = buildFlexibleMealPrompt(macroGoals, filters, favoriteFoods, excludedFoods, userPrompt);
    
    console.log('Enhanced AI Prompt with Nutrition Accuracy:', prompt);

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

🚨 CRITICAL NUTRITION ACCURACY REQUIREMENTS 🚨

MACRO CALCULATION RULES (MANDATORY):
- 1g protein = 4 calories
- 1g carbs = 4 calories  
- 1g fat = 9 calories
- Formula: (protein × 4) + (carbs × 4) + (fat × 9) = total calories
- EVERY meal must have math that adds up correctly

COMMON FOOD CALORIE REFERENCES (USE THESE AS GUIDES):
- 1 medium apple (150g): 80 calories, 0g protein, 21g carbs, 0g fat
- 1 tbsp almond butter (16g): 95 calories, 4g protein, 3g carbs, 9g fat
- 2 tbsp almond butter: 190 calories, 8g protein, 6g carbs, 18g fat
- 1 cup cooked brown rice: 220 calories, 5g protein, 45g carbs, 2g fat
- 4oz chicken breast: 185 calories, 35g protein, 0g carbs, 4g fat
- 1 large egg: 70 calories, 6g protein, 1g carbs, 5g fat
- 1 cup Greek yogurt (plain): 130 calories, 23g protein, 9g carbs, 0g fat
- 1 cup cooked quinoa: 220 calories, 8g protein, 39g carbs, 4g fat
- 1 tbsp olive oil: 120 calories, 0g protein, 0g carbs, 14g fat
- 1oz almonds (23 nuts): 160 calories, 6g protein, 6g carbs, 14g fat

REALISTIC SNACK EXAMPLES:
❌ WRONG: "Apple + 2 tbsp almond butter = 800 calories" (Actually ~270 calories!)
✅ CORRECT: "Apple + 2 tbsp almond butter = 270 calories, 8g protein, 27g carbs, 18g fat"

MANDATORY CALCULATION PROCESS:
1. Choose realistic ingredients and portions
2. Look up nutrition for each ingredient using references above
3. Add up all ingredients to get totals
4. Calculate calories: (protein × 4) + (carbs × 4) + (fat × 9)
5. Verify this equals your target calories (±10%)
6. If math doesn't work, adjust portions, don't fudge numbers!

DAILY MACRO REQUIREMENTS (MUST BE EXACT):
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
   - VERIFY MATH: (${meal.protein}×4) + (${meal.carbs}×4) + (${meal.fat}×9) should equal ${meal.calories}
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

CRITICAL VALIDATION EXAMPLES:
Example 1 - Greek Yogurt Snack (Target: 300 calories, 25g protein, 15g carbs, 10g fat):
- 1 cup Greek yogurt: 130 cal, 23g protein, 9g carbs, 0g fat
- 1/4 cup granola: 150 cal, 4g protein, 30g carbs, 6g fat  
- 1 tbsp honey: 60 cal, 0g protein, 17g carbs, 0g fat
TOTAL: 340 cal, 27g protein, 56g carbs, 6g fat
VERIFICATION: (27×4) + (56×4) + (6×9) = 108 + 224 + 54 = 386 calories
This doesn't match! Adjust portions to make math work.

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
      "nutritionVerification": "Show your math: (protein×4) + (carbs×4) + (fat×9) = calories",
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
  "dailyTotalVerification": "Show math: (total_protein×4) + (total_carbs×4) + (total_fat×9) = total_calories",
  "configurationCompliance": {
    "correctItemCount": true_or_false,
    "correctMealTypes": true_or_false,
    "appropriatePortioning": true_or_false,
    "nutritionMathCorrect": true_or_false
  }
}

CRITICAL SUCCESS CRITERIA:
1. Exactly ${mealStructure.totalItems} meals/snacks generated
2. Each meal matches its assigned type and category
3. Snacks are simple (1-3 ingredients), meals are complete (3-5 ingredients)
4. Daily totals within ±10% of macro targets
5. ALL NUTRITION MATH MUST BE CORRECT: (protein×4) + (carbs×4) + (fat×9) = calories
6. All portions realistic and properly seasoned

REJECT if you cannot meet these exact meal structure requirements OR if nutrition math is wrong.`;

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

    // Validate nutrition accuracy for each meal
    const nutritionValidationResults = [];
    for (let i = 0; i < parsed.meals.length; i++) {
      const aiMeal = parsed.meals[i];
      const expectedItem = expectedStructure.mealTypes[i];
      
      // Validate nutrition math
      const mathValidation = validateNutritionMath(aiMeal);
      const densityValidation = validateCalorieDensity(aiMeal);
      
      if (!mathValidation.isValid) {
        console.warn(`Meal ${i + 1} (${aiMeal.name}) - ${mathValidation.error}`);
        // Auto-correct the calories based on macros
        aiMeal.macros.calories = mathValidation.calculatedCalories;
        console.log(`Auto-corrected calories for ${aiMeal.name}: ${mathValidation.calculatedCalories}`);
      }
      
      if (!densityValidation.isValid) {
        console.warn(`Meal ${i + 1} (${aiMeal.name}) - ${densityValidation.error}`);
      }
      
      nutritionValidationResults.push({
        meal: aiMeal.name,
        mathValid: mathValidation.isValid,
        densityValid: densityValidation.isValid,
        correctedCalories: mathValidation.calculatedCalories
      });
      
      if (aiMeal.category !== expectedItem.category) {
        console.warn(`Item ${i + 1} category mismatch: expected ${expectedItem.category}, got ${aiMeal.category}`);
      }
    }

    console.log('Nutrition Validation Results:', nutritionValidationResults);

    // Validate overall macro accuracy
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
      
      console.log('Enhanced Nutrition Accuracy Check:', {
        mealCount: { expected: mealConfiguration.mealCount, actual: parsed.meals.filter((m: any) => m.category === 'meal').length },
        snackCount: { expected: mealConfiguration.snackCount, actual: parsed.meals.filter((m: any) => m.category === 'snack').length },
        calories: { target: targetCalories, actual: calories, accuracy: `${Math.round((1 - calorieAccuracy) * 100)}%` },
        protein: { target: targetProtein, actual: protein, accuracy: `${Math.round((1 - proteinAccuracy) * 100)}%` },
        carbs: { target: targetCarbs, actual: carbs, accuracy: `${Math.round((1 - carbAccuracy) * 100)}%` },
        fat: { target: targetFat, actual: fat, accuracy: `${Math.round((1 - fatAccuracy) * 100)}%` },
        nutritionValidation: nutritionValidationResults
      });

      if (calorieAccuracy > 0.15 || proteinAccuracy > 0.15 || carbAccuracy > 0.15 || fatAccuracy > 0.15) {
        console.warn(`AI meal plan accuracy warning - some macros >15% off target`);
        // Don't throw error, but log the warning
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
      if (aiMeal.nutritionVerification) {
        (meal as any).nutritionVerification = aiMeal.nutritionVerification;
      }

      return meal;
    });

    return meals;

  } catch (error) {
    console.error('Error parsing AI response with nutrition validation:', error);
    console.log('Raw AI response:', aiResponse);
    throw error;
  }
}

// Enhanced single meal replacement with nutrition validation
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

🚨 CRITICAL NUTRITION ACCURACY 🚨
- 1g protein = 4 calories, 1g carbs = 4 calories, 1g fat = 9 calories
- Formula: (protein × 4) + (carbs × 4) + (fat × 9) = total calories
- YOUR MATH MUST BE CORRECT!

CURRENT ${currentMeal.category.toUpperCase()} TO AVOID: "${currentMeal.name}"
INGREDIENTS TO AVOID: ${avoidIngredients.join(', ')}

TARGET MACROS (MUST BE EXACT ±10%):
- Calories: ${targetCalories} (±${Math.round(targetCalories * 0.1)})
- Protein: ${targetProtein}g (±${Math.round(targetProtein * 0.1)}g)
- Carbs: ${targetCarbs}g (±${Math.round(targetCarbs * 0.1)}g)
- Fat: ${targetFat}g (±${Math.round(targetFat * 0.1)}g)
- VERIFY: (${targetProtein}×4) + (${targetCarbs}×4) + (${targetFat}×9) should equal ${targetCalories}

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

NUTRITION REFERENCE GUIDE:
- 1 medium apple: 80 cal, 0g protein, 21g carbs, 0g fat
- 2 tbsp almond butter: 190 cal, 8g protein, 6g carbs, 18g fat
- 4oz chicken breast: 185 cal, 35g protein, 0g carbs, 4g fat
- 1 cup Greek yogurt: 130 cal, 23g protein, 9g carbs, 0g fat
- 1 tbsp olive oil: 120 cal, 0g protein, 0g carbs, 14g fat

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
  "nutritionVerification": "Show your math: (${targetProtein}×4) + (${targetCarbs}×4) + (${targetFat}×9) = ${targetCalories}",
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

    // Validate nutrition
    const mathValidation = validateNutritionMath(parsed);
    if (!mathValidation.isValid) {
      console.warn(`Single meal replacement nutrition error: ${mathValidation.error}`);
      // Auto-correct calories
      parsed.macros.calories = mathValidation.calculatedCalories;
    }

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
    if (parsed.nutritionVerification) (meal as any).nutritionVerification = parsed.nutritionVerification;

    return meal;

  } catch (error) {
    console.error('Single meal replacement error:', error);
    return null;
  }
}

// Generate meal alternatives with nutrition validation
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

🚨 NUTRITION ACCURACY REQUIRED 🚨
- Formula: (protein × 4) + (carbs × 4) + (fat × 9) = calories
- ALL 3 alternatives must have correct math!

CURRENT ${currentMeal.category.toUpperCase()} TO AVOID: "${currentMeal.name}"
INGREDIENTS TO AVOID: ${avoidIngredients.join(', ')}

TARGET MACROS PER ${currentMeal.category.toUpperCase()} (±10%):
- Calories: ${targetCalories}
- Protein: ${targetProtein}g  
- Carbs: ${targetCarbs}g
- Fat: ${targetFat}g
- VERIFY EACH: (protein×4) + (carbs×4) + (fat×9) = calories

NUTRITION REFERENCES:
- 4oz chicken breast: 185 cal, 35g protein, 0g carbs, 4g fat
- 1 cup Greek yogurt: 130 cal, 23g protein, 9g carbs, 0g fat
- 1 medium apple: 80 cal, 0g protein, 21g carbs, 0g fat
- 2 tbsp almond butter: 190 cal, 8g protein, 6g carbs, 18g fat
- 1 cup brown rice: 220 cal, 5g protein, 45g carbs, 2g fat
- 1 tbsp olive oil: 120 cal, 0g protein, 0g carbs, 14g fat

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
      "nutritionVerification": "Show math: (protein×4) + (carbs×4) + (fat×9) = calories",
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
      "nutritionVerification": "Show math: (protein×4) + (carbs×4) + (fat×9) = calories",
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
      "nutritionVerification": "Show math: (protein×4) + (carbs×4) + (fat×9) = calories",
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
      // Validate nutrition for each alternative
      const mathValidation = validateNutritionMath(alt);
      if (!mathValidation.isValid) {
        console.warn(`Alternative ${index + 1} nutrition error: ${mathValidation.error}`);
        // Auto-correct calories
        alt.macros.calories = mathValidation.calculatedCalories;
      }

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
      if (alt.nutritionVerification) (meal as any).nutritionVerification = alt.nutritionVerification;

      return meal;
    });

    return meals.slice(0, 3);

  } catch (error) {
    console.error('Meal alternatives generation error:', error);
    return [];
  }
}