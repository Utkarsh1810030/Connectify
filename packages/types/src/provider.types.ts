export type ProviderCategory =
  | 'emotional_support'
  | 'career_advice'
  | 'language_practice'
  | 'hobby_chat'
  | 'study_buddy'
  | 'general';

export interface ProviderProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  categories: ProviderCategory[];
  languages: string[];
  chatRatePerMin: number;
  voiceRatePerMin: number;
  videoRatePerMin: number;
  avgRating: number;
  totalSessions: number;
  totalMinutes: number;
  isOnline: boolean;
  isApproved: boolean;
  commissionRate: number;
  createdAt: Date;
}

export interface CreateProviderProfileDto {
  displayName: string;
  bio?: string;
  categories: ProviderCategory[];
  languages: string[];
  chatRatePerMin: number;
  voiceRatePerMin: number;
  videoRatePerMin: number;
}

export interface UpdateProviderProfileDto extends Partial<CreateProviderProfileDto> { }

export interface ProviderListItem {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  categories: ProviderCategory[];
  languages: string[];
  chatRatePerMin: number;
  voiceRatePerMin: number;
  videoRatePerMin: number;
  avgRating: number;
  totalSessions: number;
  isOnline: boolean;
}
