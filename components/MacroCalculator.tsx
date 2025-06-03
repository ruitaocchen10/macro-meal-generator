// components/MacroCalculator.tsx
import React, { useState, useEffect } from 'react';
import { Calculator, User, Activity, Target } from 'lucide-react';
import { MacroGoals } from '../types';

interface PersonalStats {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female';
  units: 'metric' | 'imperial';
  activityLevel: string;
  goal: string;
}

interface MacroCalculatorProps {
  onMacrosCalculated: (macros: MacroGoals) => void;
}

const MacroCalculator: React.FC<MacroCalculatorProps> = ({ onMacrosCalculated }) => {
  const [stats, setStats] = useState<PersonalStats>({
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    units: 'imperial',
    activityLevel: '',
    goal: ''
  });

  const [calculatedMacros, setCalculatedMacros] = useState<MacroGoals | null>(null);
  const [showResults, setShowResults] = useState(false);

  const activityLevels = [
    {
      value: 'sedentary',
      label: 'Sedentary',
      description: 'Desk job, no exercise',
      multiplier: 1.2
    },
    {
      value: 'lightly_active',
      label: 'Lightly Active', 
      description: 'Light exercise 1-3 days/week',
      multiplier: 1.375
    },
    {
      value: 'moderately_active',
      label: 'Moderately Active',
      description: 'Moderate exercise 3-5 days/week', 
      multiplier: 1.55
    },
    {
      value: 'very_active',
      label: 'Very Active',
      description: 'Hard exercise 6-7 days/week',
      multiplier: 1.725
    },
    {
      value: 'extremely_active',
      label: 'Extremely Active',
      description: 'Very hard exercise + physical job',
      multiplier: 1.9
    },
    {
      value: 'athlete_twice_daily',
      label: 'Athlete (2x Daily)',
      description: 'Training twice per day',
      multiplier: 2.0
    },
    {
      value: 'athlete_heavy',
      label: 'Heavy Training Athlete',
      description: 'Multiple daily sessions + competition',
      multiplier: 2.2
    },
    {
      value: 'manual_labor_athlete',
      label: 'Manual Labor + Training',
      description: 'Physical job + intense training',
      multiplier: 2.4
    }
  ];

  const goals = [
    // Weight Loss
    {
      value: 'conservative_loss',
      label: 'Conservative Weight Loss',
      description: '0.5 lb/week loss',
      calorieAdjustment: -250,
      category: 'loss',
      macros: { protein: 0.30, fat: 0.30, carbs: 0.40 }
    },
    {
      value: 'moderate_loss', 
      label: 'Moderate Weight Loss',
      description: '1 lb/week loss',
      calorieAdjustment: -500,
      category: 'loss',
      macros: { protein: 0.35, fat: 0.25, carbs: 0.40 }
    },
    {
      value: 'aggressive_loss',
      label: 'Aggressive Weight Loss', 
      description: '1.5-2 lb/week loss',
      calorieAdjustment: -750,
      category: 'loss',
      macros: { protein: 0.40, fat: 0.25, carbs: 0.35 }
    },
    // Maintenance
    {
      value: 'maintain',
      label: 'Maintain Current Weight',
      description: 'No weight change',
      calorieAdjustment: 0,
      category: 'maintain',
      macros: { protein: 0.25, fat: 0.30, carbs: 0.45 }
    },
    // Weight Gain
    {
      value: 'lean_bulk',
      label: 'Lean Bulk',
      description: '0.5 lb/week gain',
      calorieAdjustment: 250,
      category: 'gain',
      macros: { protein: 0.25, fat: 0.25, carbs: 0.50 }
    },
    {
      value: 'moderate_gain',
      label: 'Moderate Weight Gain',
      description: '1 lb/week gain', 
      calorieAdjustment: 500,
      category: 'gain',
      macros: { protein: 0.25, fat: 0.25, carbs: 0.50 }
    },
    {
      value: 'fast_bulk',
      label: 'Fast Bulk',
      description: '1.5 lb/week gain',
      calorieAdjustment: 750,
      category: 'gain', 
      macros: { protein: 0.20, fat: 0.25, carbs: 0.55 }
    },
    // Body Recomposition
    {
      value: 'recomposition',
      label: 'Body Recomposition',
      description: 'Lose fat + gain muscle',
      calorieAdjustment: -200,
      category: 'recomp',
      macros: { protein: 0.35, fat: 0.25, carbs: 0.40 }
    }
  ];

  const calculateMacros = (): MacroGoals | null => {
    // Validate inputs
    if (!stats.age || !stats.height || !stats.weight || !stats.activityLevel || !stats.goal) {
      return null;
    }

    // Convert to metric if needed
    let weightKg = parseFloat(stats.weight);
    let heightCm = parseFloat(stats.height);

    if (stats.units === 'imperial') {
      weightKg = weightKg * 0.453592; // lbs to kg
      heightCm = heightCm * 2.54; // inches to cm
    }

    const age = parseInt(stats.age);

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (stats.gender === 'male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }

    // Calculate TDEE
    const activityLevel = activityLevels.find(level => level.value === stats.activityLevel);
    if (!activityLevel) return null;

    const tdee = bmr * activityLevel.multiplier;

    // Apply goal adjustments
    const goal = goals.find(g => g.value === stats.goal);
    if (!goal) return null;

    const dailyCalories = Math.round(tdee + goal.calorieAdjustment);

    // Calculate macros in grams
    const proteinCalories = dailyCalories * goal.macros.protein;
    const fatCalories = dailyCalories * goal.macros.fat;
    const carbCalories = dailyCalories * goal.macros.carbs;

    const proteinGrams = Math.round(proteinCalories / 4);
    const fatGrams = Math.round(fatCalories / 9);
    const carbGrams = Math.round(carbCalories / 4);

    return {
      calories: dailyCalories.toString(),
      protein: proteinGrams.toString(),
      carbs: carbGrams.toString(),
      fat: fatGrams.toString()
    };
  };

  const handleCalculate = () => {
    const macros = calculateMacros();
    if (macros) {
      setCalculatedMacros(macros);
      setShowResults(true);
      onMacrosCalculated(macros);
    }
  };

  const handleUseTheseMacros = () => {
    if (calculatedMacros) {
      onMacrosCalculated(calculatedMacros);
    }
  };

  const isFormValid = stats.age && stats.height && stats.weight && stats.activityLevel && stats.goal;

  const goalsByCategory = {
    loss: goals.filter(g => g.category === 'loss'),
    maintain: goals.filter(g => g.category === 'maintain'), 
    gain: goals.filter(g => g.category === 'gain'),
    recomp: goals.filter(g => g.category === 'recomp')
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Macro Calculator</h2>
            <p className="text-slate-600 text-sm sm:text-base">Calculate your personalized nutrition targets</p>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Units Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-slate-100 rounded-xl p-1 flex">
              <button
                onClick={() => setStats(prev => ({ ...prev, units: 'imperial' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  stats.units === 'imperial'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇺🇸 US Units
              </button>
              <button
                onClick={() => setStats(prev => ({ ...prev, units: 'metric' }))}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  stats.units === 'metric'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌍 Metric
              </button>
            </div>
          </div>

          {/* Personal Stats */}
          <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input
                  type="number"
                  placeholder="25"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={stats.age}
                  onChange={(e) => setStats(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={stats.gender}
                  onChange={(e) => setStats(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Height ({stats.units === 'metric' ? 'cm' : 'inches'})
                </label>
                <input
                  type="number"
                  placeholder={stats.units === 'metric' ? '175' : '70'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={stats.height}
                  onChange={(e) => setStats(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Weight ({stats.units === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  placeholder={stats.units === 'metric' ? '70' : '154'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={stats.weight}
                  onChange={(e) => setStats(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
            <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Activity Level
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setStats(prev => ({ ...prev, activityLevel: level.value }))}
                  className={`p-4 text-left rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    stats.activityLevel === level.value
                      ? 'border-emerald-400 bg-emerald-100 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{level.label}</div>
                  <div className="text-sm text-slate-600 mt-1">{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Your Goal
            </h3>
            
            <div className="space-y-6">
              {/* Weight Loss */}
              <div>
                <h4 className="font-medium text-red-800 mb-3 text-sm">🔥 Weight Loss</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {goalsByCategory.loss.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setStats(prev => ({ ...prev, goal: goal.value }))}
                      className={`p-4 text-left rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        stats.goal === goal.value
                          ? 'border-red-400 bg-red-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-red-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{goal.label}</div>
                      <div className="text-sm text-slate-600 mt-1">{goal.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Maintenance */}
              <div>
                <h4 className="font-medium text-blue-800 mb-3 text-sm">⚖️ Maintenance</h4>
                <div className="grid grid-cols-1 gap-3">
                  {goalsByCategory.maintain.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setStats(prev => ({ ...prev, goal: goal.value }))}
                      className={`p-4 text-left rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        stats.goal === goal.value
                          ? 'border-blue-400 bg-blue-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{goal.label}</div>
                      <div className="text-sm text-slate-600 mt-1">{goal.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Gain */}
              <div>
                <h4 className="font-medium text-green-800 mb-3 text-sm">💪 Weight Gain</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {goalsByCategory.gain.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setStats(prev => ({ ...prev, goal: goal.value }))}
                      className={`p-4 text-left rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        stats.goal === goal.value
                          ? 'border-green-400 bg-green-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-green-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{goal.label}</div>
                      <div className="text-sm text-slate-600 mt-1">{goal.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Recomposition */}
              <div>
                <h4 className="font-medium text-purple-800 mb-3 text-sm">🎯 Body Recomposition</h4>
                <div className="grid grid-cols-1 gap-3">
                  {goalsByCategory.recomp.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setStats(prev => ({ ...prev, goal: goal.value }))}
                      className={`p-4 text-left rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        stats.goal === goal.value
                          ? 'border-purple-400 bg-purple-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-900">{goal.label}</div>
                      <div className="text-sm text-slate-600 mt-1">{goal.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="text-center">
            <button
              onClick={handleCalculate}
              disabled={!isFormValid}
              className={`group px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform ${
                isFormValid
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Calculator className="h-6 w-6 inline mr-3 group-hover:scale-110 transition-transform duration-300" />
              Calculate My Macros
            </button>
          </div>

          {/* Results */}
          {showResults && calculatedMacros && (
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 animate-in slide-in-from-bottom duration-500">
              <h3 className="font-bold text-indigo-900 mb-4 text-xl">🎉 Your Personalized Macro Targets</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-white rounded-xl border border-indigo-200">
                  <div className="text-2xl font-bold text-slate-900">{calculatedMacros.calories}</div>
                  <div className="text-sm text-slate-500">Daily Calories</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{calculatedMacros.protein}g</div>
                  <div className="text-sm text-slate-500">Protein</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{calculatedMacros.carbs}g</div>
                  <div className="text-sm text-slate-500">Carbs</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">{calculatedMacros.fat}g</div>
                  <div className="text-sm text-slate-500">Fat</div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleUseTheseMacros}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  ✨ Generate My Meal Plan
                </button>
              </div>

              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-700">
                  <strong>📊 How we calculated this:</strong> Using your stats, we calculated your Base Metabolic Rate, 
                  adjusted for your activity level, and modified based on your goal to create a science-backed nutrition plan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroCalculator;