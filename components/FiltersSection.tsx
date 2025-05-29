import React from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Filters } from '../types';

interface FiltersSectionProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}

const FiltersSection: React.FC<FiltersSectionProps> = ({ 
  filters, 
  setFilters, 
  showFilters, 
  setShowFilters 
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur-xl opacity-20"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Dietary Preferences</h2>
              <p className="text-slate-600 text-sm">Customize your meal plan</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-medium transition-all duration-300 hover:scale-105"
          >
            {showFilters ? (
              <>Hide <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Customize <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-300">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  Cooking Time Preference
                </span>
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 pr-10 bg-white rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-slate-900 font-medium hover:border-slate-300 appearance-none"
                  value={filters.cookingTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, cookingTime: e.target.value }))}
                >
                  <option value="any">Any Time</option>
                  <option value="quick">Quick (Under 15 min)</option>
                  <option value="medium">Medium (15-30 min)</option>
                  <option value="extended">Extended (30+ min)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  Dietary Restrictions
                </span>
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 pr-10 bg-white rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-slate-900 font-medium hover:border-slate-300 appearance-none"
                  value={filters.dietary}
                  onChange={(e) => setFilters(prev => ({ ...prev, dietary: e.target.value }))}
                >
                  <option value="all">No Restrictions</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten-Free</option>
                  <option value="dairy-free">Dairy-Free</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltersSection;