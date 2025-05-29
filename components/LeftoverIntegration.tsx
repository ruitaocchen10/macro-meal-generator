// components/LeftoverIntegration.tsx
import React, { useState } from 'react';
import { RefreshCw, Plus, X, Clock } from 'lucide-react';
import { Meal, MacroGoals } from '../types';

interface Leftover {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  estimatedServingSize: string;
}

interface LeftoverIntegrationProps {
  onLeftoverAdded: (leftover: Leftover) => void;
  onPlanAdjusted: (adjustedMeals: Meal[]) => void;
  currentMeals: Meal[];
  macroGoals: MacroGoals;
}

const LeftoverIntegration: React.FC<LeftoverIntegrationProps> = ({
  onLeftoverAdded,
  onPlanAdjusted,
  currentMeals,
  macroGoals
}) => {
  const [showLeftoverForm, setShowLeftoverForm] = useState(false);
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [newLeftover, setNewLeftover] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servings: '1',
    estimatedServingSize: ''
  });

  const addLeftover = () => {
    if (!newLeftover.name || !newLeftover.calories) return;
    
    const leftover: Leftover = {
      id: Date.now().toString(),
      name: newLeftover.name,
      calories: parseInt(newLeftover.calories),
      protein: parseInt(newLeftover.protein) || 0,
      carbs: parseInt(newLeftover.carbs) || 0,
      fat: parseInt(newLeftover.fat) || 0,
      servings: parseInt(newLeftover.servings) || 1,
      estimatedServingSize: newLeftover.estimatedServingSize || '1 portion'
    };

    setLeftovers([...leftovers, leftover]);
    onLeftoverAdded(leftover);
    
    // Reset form
    setNewLeftover({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      servings: '1',
      estimatedServingSize: ''
    });
    setShowLeftoverForm(false);
  };

  const removeLeftover = (id: string) => {
    setLeftovers(leftovers.filter(l => l.id !== id));
  };

  const adjustPlanWithLeftovers = () => {
    if (leftovers.length === 0) return;

    // Calculate total leftover macros
    const leftoverTotals = leftovers.reduce((acc, leftover) => ({
      calories: acc.calories + leftover.calories,
      protein: acc.protein + leftover.protein,
      carbs: acc.carbs + leftover.carbs,
      fat: acc.fat + leftover.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Calculate remaining macro targets
    const targetTotals = {
      calories: parseInt(macroGoals.calories) || 0,
      protein: parseInt(macroGoals.protein) || 0,
      carbs: parseInt(macroGoals.carbs) || 0,
      fat: parseInt(macroGoals.fat) || 0
    };

    const remainingTargets = {
      calories: Math.max(0, targetTotals.calories - leftoverTotals.calories),
      protein: Math.max(0, targetTotals.protein - leftoverTotals.protein),
      carbs: Math.max(0, targetTotals.carbs - leftoverTotals.carbs),
      fat: Math.max(0, targetTotals.fat - leftoverTotals.fat)
    };

    // Create adjusted meals (simplified - in reality you'd regenerate with remaining targets)
    const adjustedMeals = currentMeals.map((meal, index) => {
      const scaleFactor = remainingTargets.calories / (targetTotals.calories || 1);
      return {
        ...meal,
        calories: Math.round(meal.calories * scaleFactor),
        protein: Math.round(meal.protein * scaleFactor),
        carbs: Math.round(meal.carbs * scaleFactor),
        fat: Math.round(meal.fat * scaleFactor)
      };
    });

    onPlanAdjusted(adjustedMeals);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Leftover Integration</h2>
            <p className="text-slate-600 text-sm">Account for leftovers in your meal plan</p>
          </div>
        </div>
        <button
          onClick={() => setShowLeftoverForm(!showLeftoverForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 rounded-xl font-medium transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Leftover
        </button>
      </div>

      {/* Current Leftovers */}
      {leftovers.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">Current Leftovers</h3>
          <div className="grid gap-3">
            {leftovers.map((leftover) => (
              <div key={leftover.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-slate-900">{leftover.name}</h4>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      {leftover.servings} serving{leftover.servings > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-600">
                    <span>{leftover.calories} cal</span>
                    <span>{leftover.protein}g protein</span>
                    <span>{leftover.carbs}g carbs</span>
                    <span>{leftover.fat}g fat</span>
                  </div>
                </div>
                <button
                  onClick={() => removeLeftover(leftover.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={adjustPlanWithLeftovers}
            className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Adjust Plan for Leftovers
          </button>
        </div>
      )}

      {/* Add Leftover Form */}
      {showLeftoverForm && (
        <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 animate-in slide-in-from-top duration-300">
          <h3 className="font-semibold text-slate-900 mb-4">Add Leftover Item</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Leftover Name</label>
              <input
                type="text"
                placeholder="e.g., Chicken stir-fry"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.name}
                onChange={(e) => setNewLeftover({...newLeftover, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Serving Size</label>
              <input
                type="text"
                placeholder="e.g., 1 cup, 200g"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.estimatedServingSize}
                onChange={(e) => setNewLeftover({...newLeftover, estimatedServingSize: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Calories</label>
              <input
                type="number"
                placeholder="400"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.calories}
                onChange={(e) => setNewLeftover({...newLeftover, calories: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Protein (g)</label>
              <input
                type="number"
                placeholder="25"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.protein}
                onChange={(e) => setNewLeftover({...newLeftover, protein: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                placeholder="30"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.carbs}
                onChange={(e) => setNewLeftover({...newLeftover, carbs: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fat (g)</label>
              <input
                type="number"
                placeholder="15"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.fat}
                onChange={(e) => setNewLeftover({...newLeftover, fat: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Servings</label>
              <input
                type="number"
                placeholder="1"
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={newLeftover.servings}
                onChange={(e) => setNewLeftover({...newLeftover, servings: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addLeftover}
              disabled={!newLeftover.name || !newLeftover.calories}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Leftover
            </button>
            <button
              onClick={() => setShowLeftoverForm(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {leftovers.length === 0 && !showLeftoverForm && (
        <div className="text-center py-6 text-slate-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No leftovers added yet. Click "Add Leftover" to account for existing food.</p>
        </div>
      )}
    </div>
  );
};

export default LeftoverIntegration;