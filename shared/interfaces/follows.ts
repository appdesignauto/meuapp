export interface FollowRequest {
  action: 'follow' | 'unfollow';
}

export interface DesignerFollowInfo {
  id: number;
  username: string;
  name: string;
  profileimageurl: string | null;
  bio: string | null;
  role: string;
  artsCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
}