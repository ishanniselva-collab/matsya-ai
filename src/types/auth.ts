export type UserRole = 
  | 'ISRO_SCIENTIST'
  | 'MARINE_ANALYST'
  | 'COAST_GUARD'
  | 'FISHERMAN'
  | 'PUBLIC_RESEARCHER'
  | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  avatarUrl?: string;
  badge: string;
  clearanceLevel: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET';
  savedAnalysesCount: number;
}

export interface SavedAnalysis {
  id: string;
  title: string;
  date: string;
  region: string;
  variables: string[];
  summary: string;
  query: string;
  reportId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}
