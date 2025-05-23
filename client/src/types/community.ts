import type { User } from '@/types';

export interface CommunityUser extends User {
  isFollowing?: boolean;
}

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isApproved: boolean;
  userId: number;
  isLikedByUser?: boolean;
  isPinned?: boolean;
  editLink?: string;
  user: CommunityUser;
  formattedDate?: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  isHidden: boolean;
  user: CommunityUser;
}

export interface RankingUser {
  id: number;
  userId: number;
  totalPoints: number;
  rank: number;
  level: string;
  postCount: number;
  likesReceived: number;
  savesReceived: number;
  featuredCount: number;
  user: CommunityUser;
}

export interface DesignerPopular {
  id: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  bio: string | null;
  nivelacesso: string;
  role: string | null;
  artsCount: number;
  followersCount: number;
  isFollowing: boolean;
  postsCount?: number;
} 