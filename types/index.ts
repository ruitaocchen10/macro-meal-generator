export interface MacroGoals {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }
  
  export interface Filters {
    mealType: string;
    dietary: string;
  }
  
  export interface Ingredient {
    item: string;
    quantity: string;
    serving: string;
  }
  
  export interface Meal {
    id: number;
    name: string;
    type: string;
    dietary: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: Ingredient[];
  }