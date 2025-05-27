import React from 'react';
import { Target } from 'lucide-react';
import { MacroGoals } from '../types';

interface MacroGoalsInputProps {
  macroGoals: MacroGoals;
  setMacroGoals: React.Dispatch<React.SetStateAction<MacroGoals>>;
}

const MacroGoalsInput: React.FC<MacroGoalsInputProps> = ({ macroGoals, setMacroGoals }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900">Your Macro Goals</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
          <input
            type="number"
            placeholder="2000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={macroGoals.calories}
            onChange={(e) => setMacroGoals(prev => ({ ...prev, calories: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
          <input
            type="number"
            placeholder="150"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={macroGoals.protein}
            onChange={(e) => setMacroGoals(prev => ({ ...prev, protein: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
          <input
            type="number"
            placeholder="200"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={macroGoals.carbs}
            onChange={(e) => setMacroGoals(prev => ({ ...prev, carbs: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
          <input
            type="number"
            placeholder="65"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={macroGoals.fat}
            onChange={(e) => setMacroGoals(prev => ({ ...prev, fat: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
};

export default MacroGoalsInput;