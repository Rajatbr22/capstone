
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Activity, User } from '@/types';
import { mockActivities, generateId } from '@/lib/mock-data';
import { useAuth } from './AuthContext';

interface ActivityContextType {
  activities: Activity[];
  logActivity: (
    action: Activity['action'], 
    resource: string, 
    riskLevel?: Activity['riskLevel']
  ) => void;
  getUserActivities: (userId?: string) => Activity[];
  getRecentActivities: (count?: number) => Activity[];
  getHighRiskActivities: () => Activity[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const { auth } = useAuth();
  
  // Get user's activities
  const getUserActivities = (userId?: string) => {
    const targetUserId = userId || auth.user?.id;
    if (!targetUserId) return [];
    
    return activities.filter(activity => activity.userId === targetUserId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };
  
  // Get most recent activities
  const getRecentActivities = (count = 10) => {
    return [...activities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  };
  
  // Get high risk activities
  const getHighRiskActivities = () => {
    return activities.filter(activity => activity.riskLevel === 'high')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };
  
  // Log a new activity
  const logActivity = (
    action: Activity['action'], 
    resource: string, 
    riskLevel: Activity['riskLevel'] = 'low'
  ) => {
    if (!auth.user) return;
    
    // Get device info
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const deviceInfo = `${isMobile ? 'Mobile' : 'Desktop'} - ${navigator.userAgent.split(' ').pop() || 'Unknown'}`;
    
    const newActivity: Activity = {
      id: `activity-${generateId()}`,
      userId: auth.user.id,
      action,
      resource,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      deviceInfo,
      location,
      riskLevel,
      details: { browser: navigator.userAgent }
    };
    
    setActivities(prev => [newActivity, ...prev]);
  };
  
  return (
    <ActivityContext.Provider value={{
      activities,
      logActivity,
      getUserActivities,
      getRecentActivities,
      getHighRiskActivities,
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
