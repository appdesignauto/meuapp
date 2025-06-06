export type UserRole = 'visitor' | 'free' | 'premium' | 'designer' | 'designer_adm' | 'support' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  profileImageUrl?: string;
  bio?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  width?: number;
  height?: number;
  aspectRatio?: string; // ex: "1:1", "4:5", "9:16" 
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
