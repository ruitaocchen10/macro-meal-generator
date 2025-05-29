// components/TrainingDayAdjuster.tsx
import React, { useState } from 'react';
import { Dumbbell, Calendar, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { MacroGoals } from '../types';

interface TrainingDayAdjusterProps {
  baseMacroGoals: MacroGoals;
  onMacroAdjustment: (adjustedMacros: MacroGoals, dayType: 'training' | 'rest') => void;
  currentDayType: 'training' | 'rest';
  onDayTypeChange: (dayType: 'training' | 'rest') => void;
}

interface DayTypePreset {
  name: string;
  description: string;
  adjustments: {
    calorieMultiplier: number;
    proteinMultiplier: number;
    carbMultiplier: number;
    fatMultiplier: number;
  };
  icon: string;
  color: string;
}

const TrainingDayAdjuster: React.FC<TrainingDayAdjusterProps> = ({
  baseMacroGoals,
  onMacroAdjustment,
  currentDayType,
  onDayTypeChange
}) => {
  const [showCustomAdjustments, setShowCustomAdjustments] = useState(false);
  const [customAdjustments, setCustomAdjustments] = useState({
    calorieMultiplier: 1.1,
    proteinMultiplier: 1.2,
    carbMultiplier: 1.3,
    fatMultiplier: 0.9
  });

  const dayTypePresets: Record<'training' | 'rest', DayTypePreset> = {
    training: {
      name: 'Training Day',
      description: 'Higher carbs and calories for performance and recovery',
      adjustments: {
        calorieMultiplier: 1.1,  // +10% calories
        proteinMultiplier: 1.2,  // +20% protein for recovery
        carbMultiplier: 1.3,     // +30% carbs for energy
        fatMultiplier: 0.9       // -10% fat to make room for carbs
      },
      icon: '💪',
      color: 'emerald'
    },
    rest: {
      name: 'Rest Day',
      description: 'Optimized for recovery with balanced macros',
      adjustments: {
        calorieMultiplier: 0.95, // -5% calories
        proteinMultiplier: 1.1,  // +10% protein for recovery
        carbMultiplier: 0.8,     // -20% carbs (less needed)
        fatMultiplier: 1.1       // +10% fat for hormone production
      },
      icon: '🧘',
      color: 'blue'
    }
  };

  const calculateAdjustedMacros = (dayType: 'training' | 'rest', useCustom: boolean = false): MacroGoals => {
    const adjustments = useCustom ? customAdjustments : dayTypePresets[dayType].adjustments;
    
    const baseCalories = parseInt(baseMacroGoals.calories) || 0;
    const baseProtein = parseInt(baseMacroGoals.protein) || 0;
    const baseCarbs = parseInt(baseMacroGoals.carbs) || 0;
    const baseFat = parseInt(baseMacroGoals.fat) || 0;

    return {
      calories: Math.round(baseCalories * adjustments.calorieMultiplier).toString(),
      protein: Math.round(baseProtein * adjustments.proteinMultiplier).toString(),
      carbs: Math.round(baseCarbs * adjustments.carbMultiplier).toString(),
      fat: Math.round(baseFat * adjustments.fatMultiplier).toString()
    };
  };

  const handleDayTypeChange = (dayType: 'training' | 'rest') => {
    onDayTypeChange(dayType);
    const adjustedMacros = calculateAdjustedMacros(dayType);
    onMacroAdjustment(adjustedMacros, dayType);
  };

  const handleCustomAdjustment = () => {
    const adjustedMacros = calculateAdjustedMacros(currentDayType, true);
    onMacroAdjustment(adjustedMacros, currentDayType);
  };

  const resetToBase = () => {
    onMacroAdjustment(baseMacroGoals, currentDayType);
  };

  const getDifference = (current: string, base: string): { value: number; percentage: number } => {
    const currentNum = parseInt(current) || 0;
    const baseNum = parseInt(base) || 0;
    const diff = currentNum - baseNum;
    const percentage = baseNum > 0 ? Math.round((diff / baseNum) * 100) : 0;
    return { value: diff, percentage };
  };

  const currentPreset = dayTypePresets[currentDayType];
  const adjustedMacros = calculateAdjustedMacros(currentDayType);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-br from-${currentPreset.color}-500 to-${currentPreset.color}-600 rounded-xl shadow-lg`}>
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Training Day Optimizer</h2>
            <p className="text-slate-600 text-sm">Adjust macros based on your activity level</p>
          </div>
        </div>
        <button
          onClick={() => setShowCustomAdjustments(!showCustomAdjustments)}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Custom
        </button>
      </div>

      {/* Day Type Toggle */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {(Object.keys(dayTypePresets) as Array<'training' | 'rest'>).map((dayType) => {
          const preset = dayTypePresets[dayType];
          const isActive = currentDayType === dayType;
          
          return (
            <button
              key={dayType}
              onClick={() => handleDayTypeChange(dayType)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                isActive
                  ? `border-${preset.color}-400 bg-gradient-to-br from-${preset.color}-50 to-${preset.color}-100 shadow-lg`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{preset.icon}</div>
                <h3 className={`font-bold text-lg mb-1 ${isActive ? `text-${preset.color}-900` : 'text-slate-900'}`}>
                  {preset.name}
                </h3>
                <p className={`text-sm ${isActive ? `text-${preset.color}-700` : 'text-slate-600'}`}>
                  {preset.description}
                </p>
                
                {isActive && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2 bg-${preset.color}-100 rounded-lg`}>
                      <div className="font-medium">Calories</div>
                      <div className={`text-${preset.color}-700`}>
                        {preset.adjustments.calorieMultiplier > 1 ? '+' : ''}
                        {Math.round((preset.adjustments.calorieMultiplier - 1) * 100)}%
                      </div>
                    </div>
                    <div className={`p-2 bg-${preset.color}-100 rounded-lg`}>
                      <div className="font-medium">Carbs</div>
                      <div className={`text-${preset.color}-700`}>
                        {preset.adjustments.carbMultiplier > 1 ? '+' : ''}
                        {Math.round((preset.adjustments.carbMultiplier - 1) * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Macro Comparison */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Adjusted Macros for {currentPreset.name}
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Calories', current: adjustedMacros.calories, base: baseMacroGoals.calories, color: 'slate' },
            { label: 'Protein', current: adjustedMacros.protein, base: baseMacroGoals.protein, color: 'blue', unit: 'g' },
            { label: 'Carbs', current: adjustedMacros.carbs, base: baseMacroGoals.carbs, color: 'green', unit: 'g' },
            { label: 'Fat', current: adjustedMacros.fat, base: baseMacroGoals.fat, color: 'amber', unit: 'g' }
          ].map((macro) => {
            const diff = getDifference(macro.current, macro.base);
            const isIncrease = diff.value > 0;
            
            return (
              <div key={macro.label} className="text-center">
                <div className={`text-2xl font-bold text-${macro.color}-600 mb-1`}>
                  {macro.current}{macro.unit || ''}
                </div>
                <div className="text-sm text-slate-500 mb-2">{macro.label}</div>
                {diff.value !== 0 && (
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isIncrease 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {isIncrease ? '+' : ''}{diff.value}{macro.unit || ''} ({diff.percentage > 0 ? '+' : ''}{diff.percentage}%)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Adjustments */}
      {showCustomAdjustments && (
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 animate-in slide-in-from-top duration-300">
          <h4 className="font-semibold text-indigo-900 mb-4">Custom Adjustments</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { key: 'calorieMultiplier', label: 'Calories', color: 'slate' },
              { key: 'proteinMultiplier', label: 'Protein', color: 'blue' },
              { key: 'carbMultiplier', label: 'Carbs', color: 'green' },
              { key: 'fatMultiplier', label: 'Fat', color: 'amber' }
            ].map((adj) => (
              <div key={adj.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{adj.label} Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2.0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                  value={customAdjustments[adj.key as keyof typeof customAdjustments]}
                  onChange={(e) => setCustomAdjustments({
                    ...customAdjustments,
                    [adj.key]: parseFloat(e.target.value) || 1
                  })}
                />
                <div className="text-xs text-slate-500 mt-1 text-center">
                  {((customAdjustments[adj.key as keyof typeof customAdjustments] - 1) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCustomAdjustment}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300"
            >
              Apply Custom Adjustments
            </button>
            <button
              onClick={resetToBase}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h5 className="font-medium text-blue-900 mb-2">💡 Smart Timing Tips</h5>
        <div className="text-sm text-blue-700">
          {currentDayType === 'training' ? (
            <p>Training days: Extra carbs fuel your workout and aid recovery. Consider timing more carbs around your training session.</p>
          ) : (
            <p>Rest days: Lower carbs help with fat burning while maintaining protein for muscle recovery. Perfect for active recovery activities.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDayAdjuster;