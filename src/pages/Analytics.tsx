
import React, { useState } from 'react';
import { BarChart, BarChart2, PieChart, LineChart, Calendar, Filter, Download } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFiles } from '@/contexts/FileContext';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';

const Analytics: React.FC = () => {
  const { auth } = useAuth();
  const { activities } = useActivity();
  const { files } = useFiles();
  const [timePeriod, setTimePeriod] = useState('30d');
  
  // Sample data for charts
  const activityByTypeData = [
    { name: 'Login', value: activities.filter(a => a.action === 'login').length },
    { name: 'Logout', value: activities.filter(a => a.action === 'logout').length },
    { name: 'Upload', value: activities.filter(a => a.action === 'upload').length },
    { name: 'Download', value: activities.filter(a => a.action === 'download').length },
    { name: 'Delete', value: activities.filter(a => a.action === 'delete').length },
    { name: 'Access', value: activities.filter(a => a.action === 'access').length },
    { name: 'Denied', value: activities.filter(a => a.action === 'denied').length },
  ];
  
  const riskLevelData = [
    { name: 'Low', value: activities.filter(a => a.riskLevel === 'low').length },
    { name: 'Medium', value: activities.filter(a => a.riskLevel === 'medium').length },
    { name: 'High', value: activities.filter(a => a.riskLevel === 'high').length },
  ];
  
  const filesData = [
    { name: 'PDF', count: files.filter(f => f.type === 'pdf').length },
    { name: 'Word', count: files.filter(f => f.type === 'docx' || f.type === 'doc').length },
    { name: 'Excel', count: files.filter(f => f.type === 'xlsx' || f.type === 'xls').length },
    { name: 'Image', count: files.filter(f => f.type === 'jpg' || f.type === 'png').length },
    { name: 'Other', count: files.filter(f => !['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'png'].includes(f.type)).length },
  ];
  
  // Generate some time series data for the past 7 days
  const getDailyActivityData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Count activities for this day
      const dayActivities = activities.filter(a => {
        const activityDate = new Date(a.timestamp);
        return activityDate.getDate() === date.getDate() &&
               activityDate.getMonth() === date.getMonth() &&
               activityDate.getFullYear() === date.getFullYear();
      });
      
      data.push({
        name: dayStr,
        activities: dayActivities.length,
        high: dayActivities.filter(a => a.riskLevel === 'high').length,
        medium: dayActivities.filter(a => a.riskLevel === 'medium').length,
        low: dayActivities.filter(a => a.riskLevel === 'low').length,
      });
    }
    
    return data;
  };
  
  const dailyActivityData = getDailyActivityData();
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const RISK_COLORS = {
    low: '#4ade80',
    medium: '#facc15',
    high: '#f87171'
  };
  
  return (
    <Layout requireAuth={true} requiredRole="employee">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Security Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Security metrics and activity analysis
            </p>
          </div>
          
          <div className="flex gap-3">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Security Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Security Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-green-500 flex items-center justify-center">
                  <div className="text-3xl font-bold">85%</div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-3">
                Overall security rating based on activity and threat analysis
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
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-red-500">
                  {activities.filter(a => a.riskLevel === 'high').length}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  High risk events detected
                </p>
                <div className="w-full mt-4 h-3 bg-red-100 rounded">
                  <div 
                    className="h-full bg-red-500 rounded" 
                    style={{ 
                      width: `${Math.min(100, (activities.filter(a => a.riskLevel === 'high').length / activities.length) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((activities.filter(a => a.riskLevel === 'high').length / activities.length) * 100).toFixed(1)}% of total activity
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                File Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold text-orange-500">
                  {files.filter(f => f.threatScore > 0.7).length}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Files flagged as potentially risky
                </p>
                <div className="w-full mt-4 h-3 bg-orange-100 rounded">
                  <div 
                    className="h-full bg-orange-500 rounded" 
                    style={{ 
                      width: `${Math.min(100, (files.filter(f => f.threatScore > 0.7).length / files.length) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((files.filter(f => f.threatScore > 0.7).length / files.length) * 100).toFixed(1)}% of total files
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Activity Analysis
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              File Analysis
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Security Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Type</CardTitle>
                  <CardDescription>
                    Distribution of different activity types
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={activityByTypeData.sort((a, b) => b.value - a.value)}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Count" fill="#3b82f6">
                          {activityByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Risk Level Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of activity by risk level
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={riskLevelData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {riskLevelData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.name === 'Low' ? RISK_COLORS.low :
                                entry.name === 'Medium' ? RISK_COLORS.medium :
                                RISK_COLORS.high
                              } 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>
                  Activity volume over the past 7 days with risk level breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={dailyActivityData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="high" name="High Risk" stackId="a" fill={RISK_COLORS.high} />
                      <Bar dataKey="medium" name="Medium Risk" stackId="a" fill={RISK_COLORS.medium} />
                      <Bar dataKey="low" name="Low Risk" stackId="a" fill={RISK_COLORS.low} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="files" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>File Types</CardTitle>
                  <CardDescription>
                    Distribution of files by type
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={filesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {filesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>File Security Status</CardTitle>
                  <CardDescription>
                    Files by security threat level
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[
                          { name: 'Safe', value: files.filter(f => f.threatScore <= 0.3).length },
                          { name: 'Moderate', value: files.filter(f => f.threatScore > 0.3 && f.threatScore <= 0.7).length },
                          { name: 'High Risk', value: files.filter(f => f.threatScore > 0.7).length },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Files" fill="#3b82f6">
                          <Cell fill="#4ade80" />
                          <Cell fill="#facc15" />
                          <Cell fill="#f87171" />
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Files with Sensitive Content</CardTitle>
                <CardDescription>
                  Files marked as containing sensitive information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.filter(f => f.contentAnalysis?.sensitiveContent).slice(0, 6).map(file => (
                    <div 
                      key={file.id} 
                      className="p-4 border rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        file.type === 'pdf' ? 'bg-red-100 text-red-600' :
                        file.type === 'doc' || file.type === 'docx' ? 'bg-blue-100 text-blue-600' :
                        file.type === 'xls' || file.type === 'xlsx' ? 'bg-green-100 text-green-600' :
                        file.type === 'jpg' || file.type === 'png' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <PieChart className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Threat Score: {file.threatScore.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Events Trend</CardTitle>
                <CardDescription>
                  Weekly trend of security events by risk level
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={dailyActivityData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="high"
                        name="High Risk"
                        stroke={RISK_COLORS.high}
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="medium"
                        name="Medium Risk"
                        stroke={RISK_COLORS.medium}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="low"
                        name="Low Risk"
                        stroke={RISK_COLORS.low}
                        strokeWidth={2}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Failed Access Attempts</CardTitle>
                  <CardDescription>
                    Trend of unauthorized access attempts
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={dailyActivityData.map(d => ({
                          name: d.name,
                          attempts: activities.filter(a => 
                            a.action === 'denied' && 
                            new Date(a.timestamp).toLocaleDateString('en-US', { weekday: 'short' }) === d.name
                          ).length
                        }))}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attempts" name="Failed Attempts" fill="#ef4444" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Activity Score</CardTitle>
                  <CardDescription>
                    Risk score based on user behavior analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={[
                          { day: 'Mon', score: 0.2 },
                          { day: 'Tue', score: 0.3 },
                          { day: 'Wed', score: 0.5 },
                          { day: 'Thu', score: 0.4 },
                          { day: 'Fri', score: 0.3 },
                          { day: 'Sat', score: 0.1 },
                          { day: 'Sun', score: 0.2 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 1]}>
                          <Label
                            value="Risk Score"
                            angle={-90}
                            position="insideLeft"
                            style={{ textAnchor: 'middle' }}
                          />
                        </YAxis>
                        <Tooltip 
                          formatter={(value: number) => [value.toFixed(2), 'Risk Score']}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Risk Score"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;
