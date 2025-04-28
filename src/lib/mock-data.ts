
import { File, User, Activity, Notification, Role, NotificationType } from '@/types';

// Generate mock files
export const generateMockFiles = (): File[] => {
  const mockFiles: File[] = [
    {
      id: 'file-1',
      name: 'document1.pdf',
      type: 'pdf',
      size: 1024 * 1024 * 2.5, // 2.5 MB
      path: '/files/document1.pdf',
      uploadedBy: 'user-1',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      accessLevel: ['admin', 'user'],
      threatScore: 0.1,
      tags: ['document', 'report'],
      contentAnalysis: {
        contentCategory: ['document', 'report'],
        keywords: ['financial', 'report', 'quarterly', 'summary', 'earnings'],
        language: 'english',
        readingLevel: 'intermediate',
        sensitiveContent: false,
        maliciousContent: false,
        detectedEntities: ['organization', 'date', 'money'],
        confidenceScore: 0.95,
        anomalyScore: 0.1
      }
    },
    {
      id: 'file-2',
      name: 'sensitive_data.xlsx',
      type: 'xlsx',
      size: 1024 * 512, // 512 KB
      path: '/files/sensitive_data.xlsx',
      uploadedBy: 'user-2',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      accessLevel: ['admin'],
      threatScore: 0.6,
      tags: ['data', 'sensitive', 'confidential'],
      contentAnalysis: {
        contentCategory: ['data', 'spreadsheet'],
        keywords: ['personal', 'data', 'employee', 'salary', 'confidential'],
        language: 'english',
        readingLevel: 'advanced',
        sensitiveContent: true,
        maliciousContent: false,
        detectedEntities: ['person', 'organization', 'money'],
        confidenceScore: 0.88,
        anomalyScore: 0.6
      }
    },
    {
      id: 'file-3',
      name: 'suspicious_script.js',
      type: 'js',
      size: 1024 * 256, // 256 KB
      path: '/files/suspicious_script.js',
      uploadedBy: 'user-3',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      accessLevel: ['admin'],
      threatScore: 0.85,
      tags: ['code', 'script', 'suspicious'],
      contentAnalysis: {
        contentCategory: ['code', 'script'],
        keywords: ['eval', 'document', 'cookie', 'window', 'location'],
        language: 'javascript',
        readingLevel: 'advanced',
        sensitiveContent: false,
        maliciousContent: true,
        detectedEntities: ['function', 'variable', 'operation'],
        confidenceScore: 0.76,
        anomalyScore: 0.85
      }
    },
    {
      id: 'file-4',
      name: 'project_plan.docx',
      type: 'docx',
      size: 1024 * 1024 * 1.2, // 1.2 MB
      path: '/files/project_plan.docx',
      uploadedBy: 'user-1',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
      accessLevel: ['admin', 'manager', 'user'],
      threatScore: 0.05,
      tags: ['document', 'plan', 'project'],
      contentAnalysis: {
        contentCategory: ['document', 'plan'],
        keywords: ['project', 'timeline', 'milestone', 'resource', 'goal'],
        language: 'english',
        readingLevel: 'intermediate',
        sensitiveContent: false,
        maliciousContent: false,
        detectedEntities: ['organization', 'date', 'person'],
        confidenceScore: 0.92,
        anomalyScore: 0.05
      }
    },
    {
      id: 'file-5',
      name: 'user_database_backup.sql',
      type: 'sql',
      size: 1024 * 1024 * 5, // 5 MB
      path: '/files/user_database_backup.sql',
      uploadedBy: 'user-2',
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      accessLevel: ['admin'],
      threatScore: 0.7,
      tags: ['database', 'backup', 'users'],
      contentAnalysis: {
        contentCategory: ['database', 'code'],
        keywords: ['insert', 'user', 'table', 'database', 'select'],
        language: 'sql',
        readingLevel: 'advanced',
        sensitiveContent: true,
        maliciousContent: false,
        detectedEntities: ['table', 'column', 'data'],
        confidenceScore: 0.84,
        anomalyScore: 0.7
      }
    }
  ];
  
  return mockFiles;
};

// Generate other mock data
export const generateMockUsers = (): User[] => {
  const mockUsers: User[] = [
    {
      id: 'user-1',
      username: 'john_doe',
      email: 'john.doe@example.com',
      role: 'user',
      mfaEnabled: false,
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      riskScore: 0.2
    },
    {
      id: 'user-2',
      username: 'jane_smith',
      email: 'jane.smith@example.com',
      role: 'admin',
      mfaEnabled: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      riskScore: 0.8
    },
    {
      id: 'user-3',
      username: 'peter_jones',
      email: 'peter.jones@example.com',
      role: 'manager',
      mfaEnabled: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      riskScore: 0.5
    }
  ];
  
  return mockUsers;
};

export const generateMockActivities = (): Activity[] => {
  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      userId: 'user-1',
      action: 'upload',
      resource: 'document1.pdf',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome',
      deviceInfo: 'Chrome on Windows',
      location: 'New York, US',
      riskLevel: 'low',
      details: { fileType: 'pdf', fileSize: '2.5MB' }
    },
    {
      id: 'activity-2',
      userId: 'user-2',
      action: 'access',
      resource: 'sensitive_data.xlsx',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
      ipAddress: '10.0.0.5',
      userAgent: 'Firefox',
      deviceInfo: 'Firefox on macOS',
      location: 'San Francisco, US',
      riskLevel: 'medium',
      details: { fileType: 'xlsx', fileSize: '512KB' }
    },
    {
      id: 'activity-3',
      userId: 'user-3',
      action: 'delete',
      resource: 'suspicious_script.js',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      ipAddress: '172.16.0.10',
      userAgent: 'Safari',
      deviceInfo: 'Safari on macOS',
      location: 'London, UK',
      riskLevel: 'high',
      details: { fileType: 'js', fileSize: '256KB' }
    }
  ];
  
  return mockActivities;
};

export const generateMockNotifications = (): Notification[] => {
  const mockNotifications: Notification[] = [
    {
      id: 'notification-1',
      userId: 'user-1',
      title: 'File Uploaded',
      message: 'Your file document1.pdf has been successfully uploaded.',
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago (for compatibility)
      actionUrl: '/files/document1.pdf'
    },
    {
      id: 'notification-2',
      userId: 'user-2',
      title: 'Access Alert',
      message: 'User john_doe accessed sensitive_data.xlsx.',
      type: 'alert',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago (for compatibility)
      actionUrl: '/activity/activity-2'
    },
    {
      id: 'notification-3',
      userId: 'user-3',
      title: 'File Deleted',
      message: 'suspicious_script.js has been deleted by jane_smith.',
      type: 'info',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago (for compatibility)
      actionUrl: '/activity/activity-3'
    }
  ];
  
  return mockNotifications;
};

// Add mockActivities for direct export
export const mockActivities = generateMockActivities();
export const mockUsers = generateMockUsers();
export const mockFiles = generateMockFiles();
export const mockNotifications = generateMockNotifications();

// Helper function to generate random IDs - ensuring this is properly exported
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};
