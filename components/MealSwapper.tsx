// components/MealSwapper.tsx (Enhanced with Loading & Better Variety)
import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Shuffle, ThumbsDown, Zap, Loader } from 'lucide-react';
import { Meal, MacroGoals, Filters } from '../types';
import { generateSingleMealReplacement, generateMealAlternatives } from '../utils/aiMealGenerator';

interface MealSwapperProps {
 currentMeal: Meal;
 mealIndex: number;
 macroGoals: MacroGoals;
 filters: Filters;
 favoriteFoods: string[];
 excludedFoods: string[];
 onMealSwap: (mealIndex: number, newMeal: Meal) => void;
}

const MealSwapper: React.FC<MealSwapperProps> = ({
 currentMeal,
 mealIndex,
 macroGoals,
 filters,
 favoriteFoods,
 excludedFoods,
 onMealSwap
}) => {
 const [showAlternatives, setShowAlternatives] = useState(false);
 const [alternatives, setAlternatives] = useState<Meal[]>([]);
 const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
 const [isReplacingMeal, setIsReplacingMeal] = useState(false);
 
 // Progress tracking state
 const [loadingProgress, setLoadingProgress] = useState(0);
 const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
 const [loadingStage, setLoadingStage] = useState('');

 const generateAlternatives = async () => {
   setIsLoadingAlternatives(true);
   setLoadingProgress(0);
   setEstimatedTimeRemaining(8); // 8 seconds estimated
   setLoadingStage('Initializing AI...');
   
   // Simulate realistic progress
   const progressInterval = setInterval(() => {
     setLoadingProgress(prev => {
       const newProgress = Math.min(prev + Math.random() * 15 + 5, 90);
       
       // Update stages based on progress
       if (newProgress < 25) {
         setLoadingStage('Analyzing your preferences...');
         setEstimatedTimeRemaining(6);
       } else if (newProgress < 50) {
         setLoadingStage('Generating diverse recipes...');
         setEstimatedTimeRemaining(4);
       } else if (newProgress < 75) {
         setLoadingStage('Calculating nutrition values...');
         setEstimatedTimeRemaining(2);
       } else {
         setLoadingStage('Finalizing alternatives...');
         setEstimatedTimeRemaining(1);
       }
       
       return newProgress;
     });
   }, 200);

   try {
     console.log('🤖 Generating diverse meal alternatives...');
     
     // Get current meal ingredients to avoid
     const currentIngredients = currentMeal.ingredients.map(ing => ing.item);
     const avoidIngredients = [...excludedFoods, ...currentIngredients];
     
     // Generate alternatives with variety emphasis
     const newAlternatives = await generateMealAlternatives(
       currentMeal,
       macroGoals,
       filters,
       favoriteFoods,
       avoidIngredients
     );
     
     // Complete the progress
     clearInterval(progressInterval);
     setLoadingProgress(100);
     setLoadingStage('Complete!');
     
     // Brief pause to show completion
     await new Promise(resolve => setTimeout(resolve, 500));
     
     setAlternatives(newAlternatives);
     
     if (newAlternatives.length === 0) {
       console.log('No alternatives generated');
     }
   } catch (error) {
     console.error('Error generating alternatives:', error);
     clearInterval(progressInterval);
     setLoadingStage('Error occurred');
     setAlternatives([]);
   } finally {
     setIsLoadingAlternatives(false);
     setLoadingProgress(0);
     setEstimatedTimeRemaining(0);
     setLoadingStage('');
   }
 };

 const handleShowAlternatives = () => {
   if (!showAlternatives && alternatives.length === 0) {
     generateAlternatives();
   }
   setShowAlternatives(!showAlternatives);
 };

 const handleSwapMeal = (newMeal: Meal) => {
   onMealSwap(mealIndex, newMeal);
   setShowAlternatives(false);
 };

 const handleQuickReplace = async () => {
   setIsReplacingMeal(true);
   try {
     console.log('🔄 Quick replacing meal...');
     
     // Get current ingredients to avoid for variety
     const currentIngredients = currentMeal.ingredients.map(ing => ing.item);
     const avoidIngredients = [...excludedFoods, ...currentIngredients];
     
     const replacement = await generateSingleMealReplacement(
       currentMeal,
       macroGoals,
       filters,
       favoriteFoods,
       avoidIngredients
     );
     
     if (replacement) {
       handleSwapMeal(replacement);
     }
   } catch (error) {
     console.error('Quick replace error:', error);
   } finally {
     setIsReplacingMeal(false);
   }
 };

 const getMacroDifference = (newMeal: Meal) => {
   return {
     calories: newMeal.calories - currentMeal.calories,
     protein: newMeal.protein - currentMeal.protein,
     carbs: newMeal.carbs - currentMeal.carbs,
     fat: newMeal.fat - currentMeal.fat
   };
 };

 const formatMacroDiff = (diff: number, unit: string = '') => {
   const sign = diff > 0 ? '+' : '';
   const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';
   return (
     <span className={`${color} font-medium`}>
       {sign}{diff}{unit}
     </span>
   );
 };

 return (
   <div className="relative">
     {/* Main Action Buttons */}
     <div className="flex items-center gap-2">
       {/* Quick "Don't Like" Button with Loading */}
       <button
         onClick={handleQuickReplace}
         disabled={isReplacingMeal}
         className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-red-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium disabled:opacity-75 disabled:cursor-not-allowed"
       >
         {isReplacingMeal ? (
           <>
             <Loader className="h-4 w-4 animate-spin" />
             Generating...
           </>
         ) : (
           <>
             <ThumbsDown className="h-4 w-4 group-hover:scale-110 transition-transform" />
             Don't Like
           </>
         )}
       </button>

       {/* Swap Options Button */}
       <button
         onClick={handleShowAlternatives}
         disabled={isLoadingAlternatives}
         className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100"
       >
         {isLoadingAlternatives ? (
           <>
             <div className="w-4 h-4 relative">
               <div className="absolute inset-0 rounded-full border-2 border-indigo-200"></div>
               <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
             </div>
             {Math.round(loadingProgress)}% ({estimatedTimeRemaining}s)
           </>
         ) : (
           <>
             <Shuffle className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
             More Options
           </>
         )}
         {!isLoadingAlternatives && (
           showAlternatives ? (
             <ChevronUp className="h-4 w-4" />
           ) : (
             <ChevronDown className="h-4 w-4" />
           )
         )}
       </button>
     </div>

     {/* Alternatives Dropdown */}
     {showAlternatives && (
       <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-10 animate-in slide-in-from-top duration-200 min-w-96">
         <div className="flex items-center justify-between mb-3">
           <h4 className="font-semibold text-slate-900">AI Alternative {currentMeal.type}s</h4>
           <div className="flex items-center gap-2">
             <button
               onClick={generateAlternatives}
               disabled={isLoadingAlternatives}
               className="p-1 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
               title="Refresh alternatives"
             >
               <RefreshCw className={`h-4 w-4 ${isLoadingAlternatives ? 'animate-spin' : ''}`} />
             </button>
             <button
               onClick={() => setShowAlternatives(false)}
               className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
             >
               ×
             </button>
           </div>
         </div>

         {isLoadingAlternatives ? (
           <div className="text-center py-8">
             {/* Progress Bar Container */}
             <div className="max-w-xs mx-auto mb-4">
               <div className="relative">
                 {/* Background Progress Bar */}
                 <div className="w-full bg-slate-200 rounded-full h-3">
                   <div 
                     className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                     style={{ width: `${loadingProgress}%` }}
                   ></div>
                 </div>
                 
                 {/* Progress Percentage */}
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="text-xs font-semibold text-slate-700">
                     {Math.round(loadingProgress)}%
                   </span>
                 </div>
               </div>
             </div>

             {/* Spinning Icon */}
             <div className="relative mb-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
               <Zap className="h-4 w-4 text-indigo-500 absolute top-2 left-1/2 transform -translate-x-1/2" />
             </div>

             {/* Dynamic Status & Time */}
             <div className="space-y-2">
               <p className="text-sm text-slate-600 font-medium">{loadingStage}</p>
               
               {estimatedTimeRemaining > 0 && (
                 <p className="text-xs text-slate-500">
                   Estimated time: {estimatedTimeRemaining} second{estimatedTimeRemaining !== 1 ? 's' : ''} remaining
                 </p>
               )}
               
               <p className="text-xs text-slate-400">
                 Creating 3 diverse alternatives with different cuisines & cooking styles
               </p>
             </div>

             {/* Fun Loading Messages */}
             <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
               <p className="text-xs text-indigo-700">
                 {loadingProgress < 30 ? "🤖 AI is thinking of creative alternatives..." :
                  loadingProgress < 60 ? "🍳 Exploring different cuisine styles..." :
                  loadingProgress < 85 ? "📊 Double-checking nutrition accuracy..." :
                  "✨ Almost ready with your options!"}
               </p>
             </div>
           </div>
         ) : alternatives.length > 0 ? (
           <div className="space-y-3 max-h-80 overflow-y-auto">
             {alternatives.map((alternative, index) => {
               const diff = getMacroDifference(alternative);
               return (
                 <button
                   key={index}
                   onClick={() => handleSwapMeal(alternative)}
                   className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all duration-200 group"
                 >
                   <div className="flex items-start justify-between mb-3">
                     <div className="flex-1">
                       <h5 className="font-medium text-slate-900 group-hover:text-indigo-900 mb-1">
                         {alternative.name}
                       </h5>
                       <div className="flex items-center gap-2">
                         <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                           <Zap className="h-3 w-3 inline mr-1" />
                           AI Generated
                         </span>
                         {alternative.dietary !== 'none' && alternative.dietary !== 'ai-generated' && (
                           <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                             {alternative.dietary}
                           </span>
                         )}
                         <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                           🎲 Different Style
                         </span>
                       </div>
                     </div>
                   </div>

                   {/* Macro Comparison */}
                   <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                     <div className="text-center">
                       <div className="font-medium text-slate-900">{alternative.calories}</div>
                       <div className="text-slate-500">cal</div>
                       <div>{formatMacroDiff(diff.calories)}</div>
                     </div>
                     <div className="text-center">
                       <div className="font-medium text-blue-600">{alternative.protein}g</div>
                       <div className="text-slate-500">protein</div>
                       <div>{formatMacroDiff(diff.protein, 'g')}</div>
                     </div>
                     <div className="text-center">
                       <div className="font-medium text-green-600">{alternative.carbs}g</div>
                       <div className="text-slate-500">carbs</div>
                       <div>{formatMacroDiff(diff.carbs, 'g')}</div>
                     </div>
                     <div className="text-center">
                       <div className="font-medium text-amber-600">{alternative.fat}g</div>
                       <div className="text-slate-500">fat</div>
                       <div>{formatMacroDiff(diff.fat, 'g')}</div>
                     </div>
                   </div>

                   {/* Ingredients Preview */}
                   <div className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100">
                     <span className="font-medium">Key ingredients:</span> {' '}
                     {alternative.ingredients.slice(0, 3).map(ing => ing.item).join(', ')}
                     {alternative.ingredients.length > 3 && '...'}
                   </div>

                   {/* Show AI-specific features if available */}
                   {(alternative as any).description && (
                     <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                       <span className="font-medium">Why it's different:</span> {(alternative as any).description}
                     </div>
                   )}
                 </button>
               );
             })}
           </div>
         ) : (
           <div className="text-center py-6">
             <Shuffle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
             <p className="text-sm text-slate-500 mb-3">No alternatives generated. Try again for more variety!</p>
             <button
               onClick={generateAlternatives}
               className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
             >
               Generate New Alternatives
             </button>
           </div>
         )}

         <div className="mt-4 pt-3 border-t border-slate-200">
           <p className="text-xs text-slate-500 flex items-center gap-1">
             <Zap className="h-3 w-3" />
             <strong>Smart Variety:</strong> Each alternative avoids your current meal's ingredients for maximum diversity
           </p>
         </div>
       </div>
     )}
   </div>
 );
};

export default MealSwapper;