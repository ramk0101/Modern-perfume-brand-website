export type Currency = 'USD' | 'INR';

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

export interface Order {
  orderId: string;
  userId: string;
  date: string;
  type: string;
  productName: string;
  size: string;
  quantity: number;
  pricePaid: string;
  currency: string;
  status: string; // 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  customerName: string;
  address: string;
}

export interface Customer {
  uid: string;
  displayName?: string;
  email: string;
  createdAt?: string;
}

