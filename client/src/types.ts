export type UserRole = 'visitor' | 'free' | 'premium' | 'designer' | 'designer_adm' | 'support' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: string;
  profileImageUrl: string | null;
  bio: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Format {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileType {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  formats: string;
  artCount: number;
  isPremium: boolean;
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
  collectionId: number | null;
  width: number;
  height: number;
  aspectRatio: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  rating: number;
  quote: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  id: number;
  userId: number;
  artId: number;
  createdAt: Date;
}

export interface View {
  id: number;
  userId: number | null;
  artId: number;
  viewDate: Date;
  createdAt: Date;
}

export interface Download {
  id: number;
  userId: number;
  artId: number;
  downloadDate: Date;
  createdAt: Date;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  paymentMethod: string | null;
  paymentId: string | null;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  imageUrl: string | null;
  status: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: number;
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: number;
  userId: number;
  downloadsCount: number;
  viewsCount: number;
  favoritesCount: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DesignerStat {
  id: number;
  userId: number;
  artId: number;
  downloadsCount: number;
  viewsCount: number;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermission {
  id: number;
  userId: number;
  permission: string;
  createdAt: Date;
}