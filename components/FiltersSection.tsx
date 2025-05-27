import React from 'react';
import { Filter } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.mealType}
              onChange={(e) => setFilters(prev => ({ ...prev, mealType: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preference</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.dietary}
              onChange={(e) => setFilters(prev => ({ ...prev, dietary: e.target.value }))}
            >
              <option value="all">All Diets</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-Free</option>
              <option value="dairy-free">Dairy-Free</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersSection;