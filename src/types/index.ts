
export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  mfaEnabled: boolean;
  lastLogin?: Date;
  riskScore?: number;
  department_id: string;
  departmentName: string;
  failed_login_attempts: number;
  account_locked: boolean;
  lockout_until: Date;
}

export type Role = 'admin' | 'department_head' | 'employee' | 'guest';

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  content?: string | null;
  uploadedBy: string;
  uploadedAt: Date;
  accessLevel: Role[];
  threatScore: number;
  tags: string[];
  contentAnalysis?: NLPAnalysisResult | null;
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  riskLevel: 'low' | 'medium' | 'high';
  details?: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  timestamp?: Date; // Add for backward compatibility
  actionUrl?: string;
}

export type NotificationType = 'security' | 'info' | 'alert' | 'error' | 'warning' | 'success';

export interface NLPAnalysisResult {
  contentCategory: string[];
  keywords: string[];
  language: string;
  readingLevel: string;
  sensitiveContent: boolean;
  maliciousContent: boolean;
  detectedEntities: string[];
  confidenceScore: number;
  anomalyScore: number;
}

export interface SessionInfo {
  expiresAt: Date;
  lastActivity: Date;
  maxInactiveTime: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  mfaVerified: boolean;
  user: User | null;
  sessionExpiry: Date | null;
}
