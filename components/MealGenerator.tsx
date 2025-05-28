// components/MealGenerator.tsx (Enhanced Version)
import React, { useState } from 'react';
import { Wand2, Loader, ChefHat, Calendar, Target, Brain, MessageSquare } from 'lucide-react';
import { MacroGoals, Filters, Meal } from '../types';
import { generateMeals, getMealPlanInfo } from '../utils/smartMealGenerator';

interface MealGeneratorProps {
  macroGoals: MacroGoals;
  filters: Filters;
  favoriteFoods?: string[];
  onMealsGenerated: (meals: Meal[]) => void;
  onPlanInfoGenerated?: (planInfo: { routine: any; totalMacros: any }) => void;
}

const MealGenerator: React.FC<MealGeneratorProps> = ({ 
  macroGoals, 
  filters, 
  favoriteFoods = [],
  onMealsGenerated,
  onPlanInfoGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Check if AI is available
  const hasAI = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

  const generateStandardMeals = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      const meals = generateMeals(macroGoals, filters, favoriteFoods);
      const planInfo = getMealPlanInfo(macroGoals);
      
      onMealsGenerated(meals);
      if (onPlanInfoGenerated) {
        onPlanInfoGenerated(planInfo);
      }
    } catch (error) {
      console.error('Error generating meals:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIMeals = async (prompt?: string) => {
    if (!hasAI) {
      generateStandardMeals();
      return;
    }

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Dynamic import of AI functions
      const { generateAIMeals, generateMealsWithPrompt } = await import('../utils/aiMealGenerator');
      
      let meals: Meal[];
      if (prompt) {
        meals = await generateMealsWithPrompt(macroGoals, filters, favoriteFoods, prompt);
      } else {
        meals = await generateAIMeals(macroGoals, filters, favoriteFoods);
      }
      
      const planInfo = getMealPlanInfo(macroGoals);
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
      console.error('Error generating AI meals:', error);
      // Fallback to standard generation
      generateStandardMeals();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (useAI && hasAI) {
      generateAIMeals();
    } else {
      generateStandardMeals();
    }
  };

  const handleCustomGenerate = () => {
    if (customPrompt.trim()) {
      generateAIMeals(customPrompt);
    }
  };

  const hasValidGoals = macroGoals.calories || macroGoals.protein || macroGoals.carbs || macroGoals.fat;

  const promptSuggestions = [
    "Mediterranean-inspired meals",
    "Quick 15-minute recipes", 
    "High-protein muscle building",
    "Comfort food that fits macros",
    "Asian fusion cuisine",
    "Meal prep friendly options"
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              {useAI && hasAI ? (
                <Brain className="h-10 w-10 text-white" />
              ) : (
                <ChefHat className="h-10 w-10 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-slate-900">
              {useAI && hasAI ? 'AI-Powered' : 'Smart'} Meal Generator
            </h2>
          </div>

          {/* AI Toggle (only show if API key is available) */}
          {hasAI && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-slate-600">Standard</span>
              <button
                onClick={() => setUseAI(!useAI)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  useAI ? 'bg-indigo-500' : 'bg-slate-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  useAI ? 'translate-x-7' : 'translate-x-0'
                }`}></div>
              </button>
              <span className="text-slate-600 flex items-center gap-1">
                AI Enhanced <Brain className="h-4 w-4" />
              </span>
            </div>
          )}

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Smart Planning</h3>
              <p className="text-sm text-gray-600">Optimized meal timing and distribution</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Macro Precision</h3>
              <p className="text-sm text-gray-600">Meals calculated to hit your exact goals</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              {useAI && hasAI ? (
                <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              ) : (
                <ChefHat className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              )}
              <h3 className="font-semibold text-gray-900 mb-1">
                {useAI && hasAI ? 'AI Creativity' : 'Smart Recipes'}
              </h3>
              <p className="text-sm text-gray-600">
                {useAI && hasAI ? 'Creative, personalized meal ideas' : 'Detailed ingredients and portions'}
              </p>
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
                Creating Your Plan...
              </>
            ) : (
              <>
                {useAI && hasAI ? (
                  <Brain className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <Wand2 className="h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
                )}
                Generate {useAI && hasAI ? 'AI' : 'Smart'} Meal Plan
              </>
            )}
          </button>

          {/* Custom AI Prompt (only show if AI is enabled) */}
          {useAI && hasAI && (
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
                  <h4 className="font-semibold text-slate-900 mb-3">Tell AI what you want:</h4>
                  
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Create Mediterranean meals with lots of vegetables' or 'Quick breakfast options under 300 calories'"
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
                    Generate Custom Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {!hasValidGoals && (
            <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-200">
              <p className="text-amber-800 font-medium">
                <strong>Enter your macro goals above</strong> to create your personalized meal plan
              </p>
            </div>
          )}

          {!hasAI && (
            <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>💡 Want AI-powered meals?</strong> Add your Google AI API key to unlock creative, personalized meal generation!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealGenerator;