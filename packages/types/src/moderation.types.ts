export type ModerationActionType =
  | 'keyword_match'
  | 'phone_detected'
  | 'handle_detected'
  | 'manual_report'
  | 'ai_flag';

export type ModerationAction = 'warned' | 'blocked' | 'session_ended' | 'banned';

export interface ModerationLog {
  id: string;
  sessionId: string | null;
  userId: string;
  type: ModerationActionType;
  content: string | null;
  actionTaken: ModerationAction;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  sessionId: string | null;
  reason: string;
  description: string | null;
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
}

export interface CreateReportDto {
  reportedUserId: string;
  sessionId?: string;
  reason: string;
  description?: string;
}

export interface ContentFilterResult {
  isClean: boolean;
  matches: string[];
  filteredContent: string;
}
