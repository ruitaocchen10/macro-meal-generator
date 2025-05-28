// components/NutritionTrustIndicators.tsx
import React, { useState } from 'react';
import { Shield, Info, CheckCircle, Award } from 'lucide-react';
import { Food, getTrustIndicator, getConfidenceDisplay } from '../utils/foodDatabase';

interface NutritionTrustIndicatorsProps {
  food: Food;
  showDetailed?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const NutritionTrustIndicators: React.FC<NutritionTrustIndicatorsProps> = ({
  food,
  showDetailed = false,
  size = 'medium'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const trustInfo = getTrustIndicator(food);
  const confidenceInfo = getConfidenceDisplay(food.confidenceScore);

  const sizeClasses = {
    small: {
      badge: 'text-xs px-2 py-1',
      icon: 'h-3 w-3',
      text: 'text-xs'
    },
    medium: {
      badge: 'text-xs px-2.5 py-1',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    large: {
      badge: 'text-sm px-3 py-1.5',
      icon: 'h-5 w-5',
      text: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {/* Main Trust Badge */}
      <div className="relative">
        <div 
          className={`inline-flex items-center gap-1 bg-${trustInfo.color}-100 text-${trustInfo.color}-700 border border-${trustInfo.color}-200 rounded-full font-medium cursor-help ${classes.badge}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className="text-sm">{trustInfo.icon}</span>
          <span>{trustInfo.label}</span>
          <Info className={`${classes.icon} ml-1`} />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
            <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
              <div className="font-semibold mb-1">{trustInfo.label}</div>
              <div className="mb-2">{trustInfo.description}</div>
              <div className="text-slate-300">
                Confidence: {confidenceInfo.percentage}
              </div>
              {food.usdaCode && (
                <div className="text-slate-300 mt-1">
                  USDA Code: {food.usdaCode}
                </div>
              )}
              <div className="text-slate-300 mt-1">
                Last verified: {new Date(food.lastVerified).toLocaleDateString()}
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Score (if detailed view) */}
      {showDetailed && (
        <div className={`inline-flex items-center gap-1 bg-${confidenceInfo.color}-100 text-${confidenceInfo.color}-700 border border-${confidenceInfo.color}-200 rounded-full font-medium ${classes.badge}`}>
          <CheckCircle className={classes.icon} />
          <span>{confidenceInfo.label}</span>
        </div>
      )}

      {/* High confidence award */}
      {food.confidenceScore >= 95 && (
        <div className={`inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full font-medium ${classes.badge}`}>
          <Award className={classes.icon} />
          <span>Gold Standard</span>
        </div>
      )}
    </div>
  );
};

// Compact version for ingredient lists
export const CompactTrustBadge: React.FC<{ food: Food }> = ({ food }) => {
  const trustInfo = getTrustIndicator(food);
  
  return (
    <span 
      className={`inline-flex items-center gap-1 bg-${trustInfo.color}-100 text-${trustInfo.color}-700 text-xs px-1.5 py-0.5 rounded font-medium`}
      title={`${trustInfo.label} - ${trustInfo.description}`}
    >
      <span className="text-xs">{trustInfo.icon}</span>
      {food.dataSource === 'USDA' ? 'USDA' : 
       food.dataSource === 'Expert-Curated' ? 'Expert' :
       food.dataSource === 'Verified-Lab' ? 'Lab' : 'Verified'}
    </span>
  );
};

// Trust summary for meal plans
export const MealTrustSummary: React.FC<{ foods: Food[] }> = ({ foods }) => {
  const trustCounts = foods.reduce((acc, food) => {
    acc[food.dataSource] = (acc[food.dataSource] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = Math.round(
    foods.reduce((sum, food) => sum + food.confidenceScore, 0) / foods.length
  );

  const confidenceInfo = getConfidenceDisplay(avgConfidence);

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <Shield className="h-5 w-5 text-slate-600" />
      <div className="flex-1">
        <div className="font-medium text-slate-900 text-sm">Nutrition Data Quality</div>
        <div className="text-xs text-slate-600">
          {trustCounts.USDA && `${trustCounts.USDA} USDA verified`}
          {trustCounts['Expert-Curated'] && `, ${trustCounts['Expert-Curated']} expert curated`}
          {trustCounts['Verified-Lab'] && `, ${trustCounts['Verified-Lab']} lab tested`}
        </div>
      </div>
      <div className={`px-2 py-1 bg-${confidenceInfo.color}-100 text-${confidenceInfo.color}-700 rounded text-xs font-medium`}>
        {confidenceInfo.percentage} confidence
      </div>
    </div>
  );
};

export default NutritionTrustIndicators;