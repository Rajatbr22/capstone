
import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useFiles } from "@/contexts/FileContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Activity } from "@/types"
import { useActivity } from "@/contexts/ActivityContext"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"

interface ActivityItemProps {
  activity: Activity
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  return (
    <div className="flex items-center space-x-4 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium leading-none">{activity.action}</p>
        <p className="text-sm text-muted-foreground">
          User ID: {activity.userId}
        </p>
        <p className="text-sm text-muted-foreground">
          Resource: {activity.resource}
        </p>
        <p className="text-xs text-muted-foreground">
          {activity.timestamp.toLocaleDateString()}
        </p>
      </div>
      <div>
        <Badge variant="secondary">{activity.riskLevel}</Badge>
      </div>
    </div>
  )
}

const AnalyticsPage: React.FC = () => {
  const { files, getUserAccessibleFiles } = useFiles()
  const { activities } = useActivity()
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  // File type statistics
  const fileTypeStats = files.reduce((acc: { [key: string]: number }, file) => {
    const type = file.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  // Content statistics
  const contentStats = files.reduce(
    (acc, file) => {
      if (file.contentAnalysis?.sensitiveContent) {
        acc.sensitiveContent++
      }
      if (file.contentAnalysis?.maliciousContent) {
        acc.maliciousContent++
      }
      return acc
    },
    { sensitiveContent: 0, maliciousContent: 0 }
  )

  // Risk level statistics
  const riskLevelStats = activities.reduce(
    (acc: { [key: string]: number }, activity) => {
      const riskLevel = activity.riskLevel
      acc[riskLevel] = (acc[riskLevel] || 0) + 1
      return acc
    },
    { low: 0, medium: 0, high: 0 }
  )

  // Recent activities
  const recentActivities = activities.slice(0, 5)

  // Data for file type pie chart
  const fileTypeData = Object.entries(fileTypeStats).map(([name, value]) => ({
    name,
    value,
  }))

  // Data for risk level bar chart
  const riskLevelData = Object.entries(riskLevelStats).map(([name, value]) => ({
    name,
    value,
  }))

  // Mock colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  const accessibleFiles = getUserAccessibleFiles()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Files</CardTitle>
            <CardDescription>Number of files in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessible Files</CardTitle>
            <CardDescription>
              Number of files accessible to the user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessibleFiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Activities</CardTitle>
            <CardDescription>Number of activities logged</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>File Type Distribution</CardTitle>
              <CardDescription>Distribution of file types in the system</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    isAnimationActive={false}
                    data={fileTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {fileTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Content Statistics</CardTitle>
              <CardDescription>Statistics on file content</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2">Sensitive Content</h3>
                <p className="text-2xl font-bold">{contentStats.sensitiveContent}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-2">Malicious Content</h3>
                <p className="text-2xl font-bold">{contentStats.maliciousContent}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Distribution of risk levels across activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskLevelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Most recent activities in the system</CardDescription>
            <div className="flex items-center pt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage
