export type UserRole = 'visitor' | 'free' | 'premium';

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface Art {
  id: number;
  title: string;
  imageUrl: string;
  format: string;
  fileType: string;
  editUrl: string;
  isPremium: boolean;
  categoryId: number;
  collectionId: number;
}

export interface Collection {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  artCount: number;
  formats: string;
  isPremium: boolean;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Format {
  id: number;
  name: string;
  slug: string;
}

export interface FileType {
  id: number;
  name: string;
  slug: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  rating: number;
  quote: string;
}
