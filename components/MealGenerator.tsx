// components/MealGenerator.tsx (AI-First Version)
import React, { useState } from 'react';
import { Wand2, Loader, ChefHat, Calendar, Target, Brain, MessageSquare } from 'lucide-react';
import { MacroGoals, Filters, Meal } from '../types';
import { generateAIMeals } from '../utils/aiMealGenerator';
import { generateMeals, getMealPlanInfo } from '../utils/smartMealGenerator';

interface MealGeneratorProps {
  macroGoals: MacroGoals;
  filters: Filters;
  favoriteFoods?: string[]; // Now accepts text preferences instead of food IDs
  onMealsGenerated: (meals: Meal[]) => void;
  onPlanInfoGenerated?: (planInfo: { routine: any; totalMacros: any }) => void;
}

const MealGenerator: React.FC<MealGeneratorProps> = ({ 
  macroGoals, 
  filters, 
  favoriteFoods = [], // This is now text preferences
  onMealsGenerated,
  onPlanInfoGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generationMethod, setGenerationMethod] = useState<'ai' | 'standard'>('ai');

  // Check if AI is available
  const hasAI = !!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

  const generateAIFirst = async (prompt?: string) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      console.log('🤖 Attempting AI generation...');
      
      // Try AI generation first
      const meals = await generateAIMeals(macroGoals, filters, favoriteFoods, prompt);
      const planInfo = getMealPlanInfo(macroGoals);
      
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
      console.error('❌ AI generation failed, using fallback:', error);
      
      // Fallback to standard generation
      try {
        const meals = generateMeals(macroGoals, filters, favoriteFoods);
        const planInfo = getMealPlanInfo(macroGoals);
        
        console.log('✅ Fallback generation successful!', meals);
        
        onMealsGenerated(meals);
        if (onPlanInfoGenerated) {
          onPlanInfoGenerated(planInfo);
        }
        
        setGenerationMethod('standard');
      } catch (fallbackError) {
        console.error('❌ Both AI and fallback failed:', fallbackError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStandardMeals = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      console.log('🔧 Using standard generation...');
      
      const meals = generateMeals(macroGoals, filters, favoriteFoods);
      const planInfo = getMealPlanInfo(macroGoals);
      
      console.log('✅ Standard generation successful!', meals);
      
      onMealsGenerated(meals);
      if (onPlanInfoGenerated) {
        onPlanInfoGenerated(planInfo);
      }
      
      setGenerationMethod('standard');
    } catch (error) {
      console.error('❌ Standard generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (hasAI) {
      generateAIFirst();
    } else {
      generateStandardMeals();
    }
  };

  const handleCustomGenerate = () => {
    if (customPrompt.trim()) {
      generateAIFirst(customPrompt);
    }
  };

  const hasValidGoals = macroGoals.calories || macroGoals.protein || macroGoals.carbs || macroGoals.fat;

  const promptSuggestions = [
    "Mediterranean-inspired meals",
    "Quick 15-minute recipes", 
    "High-protein muscle building",
    "Comfort food that fits macros",
    "Asian fusion cuisine",
    "Meal prep friendly options",
    "Low-carb keto style",
    "Plant-based protein focus"
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              {hasAI ? (
                <Brain className="h-10 w-10 text-white" />
              ) : (
                <ChefHat className="h-10 w-10 text-white" />
              )}
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold text-slate-900">
                {hasAI ? 'AI-Powered' : 'Smart'} Meal Generator
              </h2>
              <p className="text-slate-600">
                {hasAI ? 'Intelligent meal creation with infinite variety' : 'Curated meal combinations'}
              </p>
            </div>
          </div>

          {/* Generation Method Indicator */}
          {hasAI && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`px-4 py-2 rounded-xl border-2 transition-all ${
                generationMethod === 'ai' 
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-600'
              }`}>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">AI Generation</span>
                  {generationMethod === 'ai' && <span className="text-xs">✨ Active</span>}
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-xl border-2 transition-all ${
                generationMethod === 'standard' 
                  ? 'border-amber-400 bg-amber-50 text-amber-700' 
                  : 'border-slate-200 bg-white text-slate-600'
              }`}>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  <span className="font-medium">Standard</span>
                  {generationMethod === 'standard' && <span className="text-xs">🔧 Fallback</span>}
                </div>
              </div>
            </div>
          )}

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Smart Planning</h3>
              <p className="text-sm text-gray-600">
                {hasAI ? 'AI calculates optimal meal distribution' : 'Optimized meal timing and distribution'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Macro Precision</h3>
              <p className="text-sm text-gray-600">
                {hasAI ? 'AI targets within 5% accuracy' : 'Meals calculated to hit your exact goals'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              {hasAI ? (
                <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              ) : (
                <ChefHat className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              )}
              <h3 className="font-semibold text-gray-900 mb-1">
                {hasAI ? 'Infinite Variety' : 'Smart Recipes'}
              </h3>
              <p className="text-sm text-gray-600">
                {hasAI ? 'Unlimited meal combinations and cuisines' : 'Detailed ingredients and portions'}
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
                {hasAI ? 'AI Creating Your Plan...' : 'Creating Your Plan...'}
              </>
            ) : (
              <>
                {hasAI ? (
                  <Brain className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <Wand2 className="h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
                )}
                Generate {hasAI ? 'AI' : 'Smart'} Meal Plan
              </>
            )}
          </button>

          {/* Custom AI Prompt (only show if AI is available) */}
          {hasAI && (
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
                    Generate Custom AI Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Standard Generation (for testing) */}
          {hasAI && (
            <div className="mt-4">
              <button
                onClick={generateStandardMeals}
                disabled={isGenerating || !hasValidGoals}
                className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              >
                🔧 Use Standard Generation (Fallback)
              </button>
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