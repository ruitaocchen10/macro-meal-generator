import React from 'react';
import { Target } from 'lucide-react';
import { MacroGoals } from '../types';

interface MacroGoalsInputProps {
  macroGoals: MacroGoals;
  setMacroGoals: (goals: MacroGoals) => void;
}

const MacroGoalsInput: React.FC<MacroGoalsInputProps> = ({ macroGoals, setMacroGoals }) => {
  const macroFields = [
    {
      key: 'calories' as keyof MacroGoals,
      label: 'Daily Calories',
      placeholder: '2000',
      color: 'indigo',
      icon: '🔥'
    },
    {
      key: 'protein' as keyof MacroGoals,
      label: 'Protein (g)',
      placeholder: '150',
      color: 'blue',
      icon: '💪'
    },
    {
      key: 'carbs' as keyof MacroGoals,
      label: 'Carbs (g)',
      placeholder: '200',
      color: 'green',
      icon: '🌾'
    },
    {
      key: 'fat' as keyof MacroGoals,
      label: 'Fat (g)',
      placeholder: '65',
      color: 'amber',
      icon: '🥑'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {macroFields.map((field) => (
          <div key={field.key} className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <span className="flex items-center gap-2">
                <span className="text-lg">{field.icon}</span>
                {field.label}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder={field.placeholder}
                className={`
                  w-full px-4 py-4 bg-white rounded-xl border-2 border-slate-200 
                  focus:border-${field.color}-500 focus:ring-4 focus:ring-${field.color}-500/20 
                  transition-all duration-300 text-lg font-semibold text-slate-900
                  hover:border-slate-300 group-hover:shadow-lg
                  placeholder:text-slate-400 placeholder:font-normal
                `}
                value={macroGoals[field.key]}
                onChange={(e) => setMacroGoals({ ...macroGoals, [field.key]: e.target.value })}
              />
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-${field.color}-500/10 to-${field.color}-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick preset buttons */}
      <div className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Quick Presets</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Weight Loss', calories: '1800', protein: '140', carbs: '150', fat: '60' },
            { label: 'Maintenance', calories: '2200', protein: '165', carbs: '220', fat: '75' },
            { label: 'Muscle Gain', calories: '2600', protein: '200', carbs: '280', fat: '85' }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                const newGoals: MacroGoals = {
                  calories: preset.calories,
                  protein: preset.protein,
                  carbs: preset.carbs,
                  fat: preset.fat
                };
                setMacroGoals(newGoals);
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 hover:border-slate-300 text-sm font-medium transition-all duration-200 hover:shadow-md"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MacroGoalsInput;