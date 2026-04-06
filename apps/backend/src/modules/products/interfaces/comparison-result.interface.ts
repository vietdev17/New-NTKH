export interface ComparisonProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  basePrice: number;
  priceRange: { min: number; max: number };
  brand: string;
  material: string;
  origin: string;
  colors: { name: string; hexCode: string }[];
  dimensions: { label: string; width: number; depth: number; height: number }[];
  specifications: Record<string, string>;
  rating: { average: number; count: number };
  totalSold: number;
}

export interface ComparisonResult {
  products: ComparisonProduct[];
  comparisonFields: string[];
}
