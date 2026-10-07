export type ProductCategory = 'scarves' | 'veils' | 'accessories' | 'others';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image_url: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CategoryFilter = 'all' | ProductCategory;

export interface CategoryMeta {
  key: ProductCategory;
  label: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'scarves',
    label: 'Scarves',
    description: 'Chiffon, silk, modal, and pleated scarves in rich and muted tones.',
  },
  {
    key: 'veils',
    label: 'Veils',
    description: 'Bridal, ceremonial, and bespoke sheer tulle & lace veils.',
  },
  {
    key: 'accessories',
    label: 'Accessories',
    description: 'Premium magnetic pins, handcrafted brooches, undercaps, and clips.',
  },
  {
    key: 'others',
    label: 'Others',
    description: 'Signature packaging, gift sets, garment care, and exclusive collections.',
  },
];
