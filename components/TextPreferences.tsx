import React, { useState } from 'react';
import { Heart, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface TextPreferencesProps {
  preferences: string[];
  exclusions: string[];
  onPreferencesChange: (preferences: string[]) => void;
  onExclusionsChange: (exclusions: string[]) => void;
  showPreferences: boolean;
  setShowPreferences: React.Dispatch<React.SetStateAction<boolean>>;
}

const TextPreferences: React.FC<TextPreferencesProps> = ({
  preferences,
  exclusions,
  onPreferencesChange,
  onExclusionsChange,
  showPreferences,
  setShowPreferences
}) => {
  const [newPreference, setNewPreference] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const addPreference = () => {
    if (newPreference.trim() && !preferences.includes(newPreference.trim())) {
      onPreferencesChange([...preferences, newPreference.trim()]);
      setNewPreference('');
    }
  };

  const removePreference = (preference: string) => {
    onPreferencesChange(preferences.filter(p => p !== preference));
  };

  const addExclusion = () => {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      onExclusionsChange([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const removeExclusion = (exclusion: string) => {
    onExclusionsChange(exclusions.filter(e => e !== exclusion));
  };

  const handlePreferenceKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPreference();
    }
  };

  const handleExclusionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addExclusion();
    }
  };

  const totalItems = preferences.length + exclusions.length;

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
              {totalItems > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-slate-600 text-sm">Personalizing your meal plans</p>
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
                    {totalItems} items
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
              <>Customize <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>

        {!showPreferences && totalItems > 0 && (
          <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {preferences.length > 0 && (
                <span className="text-emerald-800 font-medium">
                  ✨ {preferences.length} favorite{preferences.length !== 1 ? 's' : ''}
                </span>
              )}
              {exclusions.length > 0 && (
                <span className="text-red-800 font-medium">
                  🚫 {exclusions.length} excluded
                </span>
              )}
            </div>
          </div>
        )}

        {showPreferences && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <p className="text-blue-800 font-medium text-sm">
                💡 Tell us what you love and what to avoid - we'll create the perfect meal plan for you!
              </p>
            </div>

            {/* Foods You Love Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-600 fill-current" />
                Foods You Love
              </h4>
              
              {/* Add New Preference */}
              <div className="mb-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    onKeyPress={handlePreferenceKeyPress}
                    placeholder="e.g., chicken breast, salmon, sweet potato..."
                    className="flex-1 px-4 py-3 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    onClick={addPreference}
                    disabled={!newPreference.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Current Preferences */}
              {preferences.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-emerald-900 mb-3">Your Favorites ({preferences.length}):</h5>
                  <div className="flex flex-wrap gap-2">
                    {preferences.map((preference, index) => (
                      <span
                        key={index}
                        className="group inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-800 text-sm font-medium px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors"
                      >
                        <Heart className="h-3 w-3 text-emerald-500 fill-current" />
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

              {/* Quick Add Suggestions for Preferences */}
              <div>
                <h5 className="font-medium text-emerald-900 mb-3 text-sm">Quick Add Favorites:</h5>
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
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Foods to Avoid Section */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                Foods to Avoid
              </h4>
              
              {/* Add New Exclusion */}
              <div className="mb-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    onKeyPress={handleExclusionKeyPress}
                    placeholder="e.g., greek yogurt, mushrooms, shellfish..."
                    className="flex-1 px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    onClick={addExclusion}
                    disabled={!newExclusion.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Current Exclusions */}
              {exclusions.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-red-900 mb-3">Foods You're Avoiding ({exclusions.length}):</h5>
                  <div className="flex flex-wrap gap-2">
                    {exclusions.map((exclusion, index) => (
                      <span
                        key={index}
                        className="group inline-flex items-center gap-2 bg-white border border-red-200 text-red-800 text-sm font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <X className="h-3 w-3 text-red-500" />
                        {exclusion}
                        <button
                          onClick={() => removeExclusion(exclusion)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-1 transition-colors"
                          title="Remove exclusion"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Add Suggestions for Exclusions */}
              <div>
                <h5 className="font-medium text-red-900 mb-3 text-sm">Common Exclusions:</h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Greek yogurt', 'Mushrooms', 'Shellfish', 'Dairy', 
                    'Gluten', 'Nuts', 'Soy', 'Eggs', 'Fish', 'Beans'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        if (!exclusions.includes(suggestion)) {
                          onExclusionsChange([...exclusions, suggestion]);
                        }
                      }}
                      disabled={exclusions.includes(suggestion)}
                      className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Usage Summary */}
            {totalItems > 0 && (
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                <h5 className="font-medium text-indigo-900 mb-2">🎯 Your Meal Plan Will:</h5>
                <div className="text-sm text-indigo-700 space-y-1">
                  {preferences.length > 0 && (
                    <p>✨ Prioritize and include your {preferences.length} favorite food{preferences.length !== 1 ? 's' : ''}</p>
                  )}
                  {exclusions.length > 0 && (
                    <p>🚫 Never include any of your {exclusions.length} excluded food{exclusions.length !== 1 ? 's' : ''}</p>
                  )}
                  <p>🤖 Use AI to create delicious alternatives that fit your preferences</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextPreferences;