export interface Option {
    name: string;
    details: string[];
  }
  
export type NutrientEffect = "Ignore" | "Above" | "Below";

export interface NutrientLimit {
    name: string;
    effect: NutrientEffect
    limit: number;
    unit: string;
  }


export type Challenge = {
    id?: string | number;
    name: string;
    criteria: string;
    value: string;
  };

export interface Product {
    name: string;
    nutrients: Record<string, string>; // Object where keys are nutrient names and values are strings
  }