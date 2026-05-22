export interface ClothingItem {
  id: string;
  name: string;
  brand?: string;
  price?: string;
  imageUrl: string;
  description: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'full-body';
  productUrl?: string;
  productImageUrl?: string;
}

export interface UserProfile {
  photo?: string;
  bodyType?: string;
  stylePreference?: string[];
  measurements?: string;
}

export type AppState = 'landing' | 'assistant' | 'tryon' | 'feed' | 'profile';
