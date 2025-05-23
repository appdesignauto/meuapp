export interface User {
  id: number;
  username: string;
  name: string | null;
  profileimageurl: string | null;
  nivelacesso: string;
  email?: string;
  role?: string;
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
  user: User;
  formattedDate?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  postId: number;
  isHidden: boolean;
  user: {
    id: number;
    username: string;
    name: string | null;
    profileimageurl: string | null;
    nivelacesso: string;
  };
} 