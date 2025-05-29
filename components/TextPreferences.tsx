import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface TextPreferencesProps {
  preferences: string[]; // Changed from selectedFoods to preferences
  onPreferencesChange: (preferences: string[]) => void; // Changed from onFoodsChange
  showPreferences: boolean;
  setShowPreferences: React.Dispatch<React.SetStateAction<boolean>>;
}

const TextPreferences: React.FC<TextPreferencesProps> = ({
  preferences, // Changed from selectedFoods
  onPreferencesChange, // Changed from onFoodsChange
  showPreferences,
  setShowPreferences
}) => {
  const [newPreference, setNewPreference] = useState('');

  const addPreference = () => {
    if (newPreference.trim() && !preferences.includes(newPreference.trim())) {
      onPreferencesChange([...preferences, newPreference.trim()]);
      setNewPreference('');
    }
  };

  const removePreference = (preference: string) => {
    onPreferencesChange(preferences.filter(p => p !== preference));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPreference();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Food Preferences</h2>
              {preferences.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-slate-600 text-sm">Personalizing with your favorites</p>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
                    {preferences.length} selected
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            {showPreferences ? (
              <>Hide <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Add Preferences <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {!showPreferences && preferences.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
            <p className="text-rose-800 font-medium text-sm">
              ✨ Using your {preferences.length} favorite foods to create personalized meals
            </p>
          </div>
        )}

        {showPreferences && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <p className="text-blue-800 font-medium text-sm">
                💡 Add foods you love and we'll prioritize them when creating your meal plans
              </p>
            </div>

            {/* Add New Preference */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Add Food Preferences</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newPreference}
                  onChange={(e) => setNewPreference(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., chicken breast, salmon, sweet potato..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                <button
                  onClick={addPreference}
                  disabled={!newPreference.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current Preferences */}
            {preferences.length > 0 && (
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500 fill-current" />
                  Your Food Preferences ({preferences.length}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.map((preference, index) => (
                    <span
                      key={index}
                      className="group inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-800 text-sm font-medium px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors"
                    >
                      {preference}
                      <button
                        onClick={() => removePreference(preference)}
                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full p-1 transition-colors"
                        title="Remove preference"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Suggestions */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h5 className="font-medium text-slate-900 mb-3">Quick Add Suggestions:</h5>
              <div className="flex flex-wrap gap-2">
                {[
                  'Chicken breast', 'Salmon', 'Greek yogurt', 'Sweet potato', 
                  'Brown rice', 'Avocado', 'Eggs', 'Quinoa', 'Spinach', 'Almonds'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      if (!preferences.includes(suggestion)) {
                        onPreferencesChange([...preferences, suggestion]);
                      }
                    }}
                    disabled={preferences.includes(suggestion)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPreferences;