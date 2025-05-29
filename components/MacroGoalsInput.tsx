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
  );
};

export default MacroGoalsInput;