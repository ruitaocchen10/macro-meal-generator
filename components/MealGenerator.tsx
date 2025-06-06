// components/MealGenerator.tsx - Updated for Flexible Meal/Snack System
import React, { useState } from 'react';
import { Brain, Loader, Calendar, Target, MessageSquare } from 'lucide-react';
import { MacroGoals, Filters, Meal, generateMealStructure } from '../types';
import { generateAIMeals } from '../utils/aiMealGenerator';

interface MealGeneratorProps {
  macroGoals: MacroGoals;
  filters: Filters;
  favoriteFoods?: string[];
  excludedFoods?: string[];
  onMealsGenerated: (meals: Meal[]) => void;
  onPlanInfoGenerated?: (planInfo: { routine: any; totalMacros: any }) => void;
}

const MealGenerator: React.FC<MealGeneratorProps> = ({ 
  macroGoals, 
  filters, 
  favoriteFoods = [],
  excludedFoods = [],
  onMealsGenerated,
  onPlanInfoGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Check if AI is available
  // In components/MealGenerator.tsx, improve the check
const hasAI = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

  // Enhanced plan info creation with meal configuration
  const createPlanInfo = (macroGoals: MacroGoals, mealConfig: any) => {
    const totalItems = mealConfig.mealCount + mealConfig.snackCount;
    let description = `${mealConfig.mealCount} meal${mealConfig.mealCount !== 1 ? 's' : ''}`;
    if (mealConfig.snackCount > 0) {
      description += ` + ${mealConfig.snackCount} snack${mealConfig.snackCount !== 1 ? 's' : ''}`;
    }
    description += ' with AI-optimized macro distribution';

    return {
      routine: {
        name: `${totalItems}-Item AI Structure`,
        description
      },
      totalMacros: {
        calories: parseInt(macroGoals.calories) || 0,
        protein: parseInt(macroGoals.protein) || 0,
        carbs: parseInt(macroGoals.carbs) || 0,
        fat: parseInt(macroGoals.fat) || 0
      }
    };
  };

  const generateAIFirst = async (prompt?: string) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      console.log('🤖 Generating AI meals with configuration:', filters.mealConfiguration);
      
      const meals = await generateAIMeals(macroGoals, filters, favoriteFoods, excludedFoods, prompt);
      const planInfo = createPlanInfo(macroGoals, filters.mealConfiguration);
      
      console.log('✅ AI generation successful!', meals);
      
      onMealsGenerated(meals);
      if (onPlanInfoGenerated) {
        onPlanInfoGenerated(planInfo);
      }

      // Clear prompt after successful generation
      if (prompt) {
        setCustomPrompt('');
        setShowCustomPrompt(false);
      }

    } catch (error) {
      console.error('❌ AI generation failed:', error);
      alert('AI meal generation failed. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (hasAI) {
      generateAIFirst();
    } else {
      alert('AI meal generation requires a Google AI API key. Please add your API key to continue.');
    }
  };

  const handleCustomGenerate = () => {
    if (customPrompt.trim()) {
      generateAIFirst(customPrompt);
    }
  };

  const hasValidGoals = macroGoals.calories || macroGoals.protein || macroGoals.carbs || macroGoals.fat;

  // Get meal structure summary
  const getMealStructureSummary = () => {
    const meals = filters.mealConfiguration.mealCount;
    const snacks = filters.mealConfiguration.snackCount;
    
    let text = `${meals} meal${meals !== 1 ? 's' : ''}`;
    if (snacks > 0) {
      text += ` + ${snacks} snack${snacks !== 1 ? 's' : ''}`;
    }
    return text;
  };

  const promptSuggestions = [
    "Mediterranean-inspired meals with simple snacks",
    "Quick breakfast & easy grab-and-go snacks", 
    "High-protein meals with protein-rich snacks",
    "Comfort food meals with healthy snacks",
    "Asian fusion meals with fruit-based snacks",
    "Meal prep friendly options with portable snacks",
    "Low-carb meals with keto-friendly snacks",
    "Plant-based meals with vegan snack options"
  ];

  // Generate preview structure for display
  const previewStructure = generateMealStructure(
    filters.mealConfiguration.mealCount, 
    filters.mealConfiguration.snackCount
  );

  if (!hasAI) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-3xl blur-xl opacity-20"></div>
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-12">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg mx-auto w-fit mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">AI Setup Required</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              This app requires a Google AI API key to generate personalized meal structures. Please add your API key to get started.
            </p>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-800 text-sm">
                <strong>Need an API key?</strong> Visit the Google AI Studio to get your free API key, then add it to your environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold text-slate-900">AI Meal Structure Generator</h2>
              <p className="text-slate-600">Intelligent {getMealStructureSummary()} with perfect macro distribution</p>
            </div>
          </div>

          {/* Current Structure Preview */}
          <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
            <h3 className="font-semibold text-emerald-900 mb-4 flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Selected Structure ({previewStructure.totalItems} items)
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {previewStructure.mealTypes.map((item, index) => (
                <span 
                  key={index}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    item.category === 'meal' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {item.category === 'meal' ? '🍽️' : '🥨'} {item.name} ({item.caloriePercentage}%)
                </span>
              ))}
            </div>
          </div>

          {/* AI Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Calendar className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Flexible Structure</h3>
              <p className="text-sm text-gray-600">Choose any combination of meals & snacks</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Macro Precision</h3>
              <p className="text-sm text-gray-600">Each item hits its exact calorie percentage target</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Context Aware</h3>
              <p className="text-sm text-gray-600">Meals get complex recipes, snacks stay simple</p>
            </div>
          </div>

          {/* Main Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !hasValidGoals}
            className={`
              group relative inline-flex items-center gap-4 px-12 py-6 rounded-2xl font-semibold text-xl transition-all duration-300 transform
              ${isGenerating || !hasValidGoals
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
                AI Creating Your {getMealStructureSummary()}...
              </>
            ) : (
              <>
                <Brain className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
                Generate AI Meal Structure
              </>
            )}
          </button>

          {/* Generation Preview */}
          {isGenerating && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span className="text-indigo-700 font-medium">AI is working on your structure...</span>
              </div>
              <div className="text-sm text-indigo-600 space-y-1">
                <p>🧠 Analyzing your macro targets and food preferences</p>
                <p>🍽️ Creating {filters.mealConfiguration.mealCount} complete meals with complex recipes</p>
                <p>🥨 Designing {filters.mealConfiguration.snackCount} simple snacks with quick prep</p>
                <p>📊 Ensuring each item hits its exact macro percentage target</p>
              </div>
            </div>
          )}

          {/* Custom AI Prompt */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <button
              onClick={() => setShowCustomPrompt(!showCustomPrompt)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300"
            >
              <MessageSquare className="h-5 w-5" />
              Custom AI Request
            </button>

            {showCustomPrompt && (
              <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top duration-300">
                <h4 className="font-semibold text-slate-900 mb-3">Customize your {getMealStructureSummary()}:</h4>
                
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={`e.g., 'Create Mediterranean meals with simple Greek yogurt snacks' or 'High-protein breakfast with low-carb snacks'`}
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-900"
                  rows={3}
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-slate-600 font-medium">Try:</span>
                  {promptSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setCustomPrompt(suggestion)}
                      className="text-xs px-3 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCustomGenerate}
                  disabled={!customPrompt.trim() || isGenerating}
                  className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Custom AI Structure
                </button>
              </div>
            )}
          </div>

          {!hasValidGoals && (
            <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-200">
              <p className="text-amber-800 font-medium">
                <strong>Enter your macro goals above</strong> to create your personalized AI meal structure
              </p>
            </div>
          )}

          {/* Structure Benefits */}
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4">🎯 Why This Structure Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="space-y-2">
                <p>✅ <strong>Meals (~75% total):</strong> Complete nutrition with 3-5 ingredients</p>
                <p>✅ <strong>Snacks (~25% total):</strong> Simple prep with 1-3 ingredients</p>
              </div>
              <div className="space-y-2">
                <p>✅ <strong>Smart Distribution:</strong> Protein evenly spread for muscle synthesis</p>
                <p>✅ <strong>Flexible Choice:</strong> Pick exactly what fits your lifestyle</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealGenerator;