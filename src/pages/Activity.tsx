
import React, { useState } from 'react';
import { 
  Activity as ActivityIcon, 
  Shield, 
  Clock, 
  Filter, 
  AlertTriangle,
  CheckCircle2,
  Upload,
  Download,
  FileText,
  Trash,
  Lock,
  Calendar,
  Computer,
  MapPin
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivity } from '@/contexts/ActivityContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Activity as ActivityType } from '@/types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const Activity: React.FC = () => {
  const { getRecentActivities, activities } = useActivity();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState<string>('24h');
  
  // Get the current date for comparison
  const now = new Date();
  
  // Filter activities based on time period
  const filterByTimePeriod = (activity: ActivityType) => {
    const activityTime = new Date(activity.timestamp).getTime();
    
    switch (timePeriod) {
      case '1h':
        return now.getTime() - activityTime <= 60 * 60 * 1000;
      case '24h':
        return now.getTime() - activityTime <= 24 * 60 * 60 * 1000;
      case '7d':
        return now.getTime() - activityTime <= 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now.getTime() - activityTime <= 30 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  };
  
  // Filter activities based on search, risk level, action type, and time period
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.deviceInfo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = 
      filterRisk === 'all' || 
      activity.riskLevel === filterRisk;
    
    const matchesAction = 
      filterAction === 'all' || 
      activity.action === filterAction;
    
    return matchesSearch && matchesRisk && matchesAction && filterByTimePeriod(activity);
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Calculate statistics
  const totalActivities = filteredActivities.length;
  const highRiskActivities = filteredActivities.filter(a => a.riskLevel === 'high').length;
  const deniedAccessAttempts = filteredActivities.filter(a => a.action === 'denied').length;
  const successfulLogins = filteredActivities.filter(a => a.action === 'login').length;
  
  // Group activities by day for timeline view
  const groupedByDay = filteredActivities.reduce<Record<string, ActivityType[]>>((acc, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {});
  
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Activity Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Track and analyze system activities
            </p>
          </div>
          
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-blue-500" />
                <div className="text-2xl font-bold">{totalActivities}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                During selected time period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Risk Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="text-2xl font-bold">{highRiskActivities}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {highRiskActivities > 0 ? 'Requires attention' : 'No high risk events detected'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-500" />
                <div className="text-2xl font-bold">{deniedAccessAttempts}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unauthorized access attempts blocked
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Successful Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div className="text-2xl font-bold">{successfulLogins}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Authenticated sessions created
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <ActivityIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search activities..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="w-4 h-4" />
                <span>Risk Level</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRisk('all')}>
                All Levels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRisk('low')}>
                Low Risk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRisk('medium')}>
                Medium Risk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRisk('high')}>
                High Risk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="w-4 h-4" />
                <span>Action Type</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterAction('all')}>
                All Actions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('login')}>
                Login
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('logout')}>
                Logout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('upload')}>
                Upload
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('download')}>
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('delete')}>
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('access')}>
                Access
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAction('denied')}>
                Denied
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Chronological record of system activities
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {Object.keys(groupedByDay).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedByDay).map(([date, dayActivities]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium">{date}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {dayActivities.map((activity) => (
                        <div key={activity.id} className="flex gap-4">
                          <div className={cn(
                            "mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            activity.action === 'login' ? 'bg-green-100 text-green-600' :
                            activity.action === 'logout' ? 'bg-blue-100 text-blue-600' :
                            activity.action === 'upload' ? 'bg-purple-100 text-purple-600' :
                            activity.action === 'download' ? 'bg-cyan-100 text-cyan-600' :
                            activity.action === 'delete' ? 'bg-red-100 text-red-600' :
                            activity.action === 'access' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-red-100 text-red-600'
                          )}>
                            {activity.action === 'login' && <CheckCircle2 className="w-4 h-4" />}
                            {activity.action === 'logout' && <Lock className="w-4 h-4" />}
                            {activity.action === 'upload' && <Upload className="w-4 h-4" />}
                            {activity.action === 'download' && <Download className="w-4 h-4" />}
                            {activity.action === 'delete' && <Trash className="w-4 h-4" />}
                            {activity.action === 'access' && <FileText className="w-4 h-4" />}
                            {activity.action === 'denied' && <AlertTriangle className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{activity.action}</span>
                              <Badge variant={
                                activity.riskLevel === 'high' ? 'destructive' :
                                activity.riskLevel === 'medium' ? 'default' :
                                'secondary'
                              }>
                                {activity.riskLevel} risk
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mt-1">
                              Resource: {activity.resource}
                            </div>
                            
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Computer className="w-3 h-3" />
                                <span>
                                {
                                  activity.userAgent
                                }
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{activity.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                  <ActivityIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No activities found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Activity;
