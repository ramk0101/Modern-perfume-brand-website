export type Currency = 'USD' | 'EUR' | 'GBP';

export interface Fragrance {
  id: string;
  name: string;
  collection: 'Homme' | 'Femme' | 'Universal' | 'Bespoke';
  notes: string[];
  image: string;
  description: string;
  price: number;
  detailedStory?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  volume?: string;
}

export interface CartItem {
  fragrance: Fragrance;
  quantity: number;
  size: '50ml' | '100ml';
}

export type OlfactoryPreference = 'Woody & Warm' | 'Fresh & Citrus' | 'Floral & Airy' | 'Dark & Spicy';

export interface FinderRequest {
  name: string;
  email: string;
  preference: OlfactoryPreference;
}

export interface CuratedScent {
  name: string;
  notes: string[];
  story: string;
  personality: string;
  wearScenario: string;
  price: number;
}
