import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart, 
  Download, 
  Users, 
  BookOpen, 
  ClipboardList, 
  Activity 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

// Sample data - in a real application, this would come from API
const pieData = [
  { name: 'Completed', value: 45, color: '#3f51b5' },
  { name: 'In Progress', value: 35, color: '#ff6e40' },
  { name: 'Not Started', value: 20, color: '#e0e0e0' },
];

const barData = [
  { name: 'Intro to Programming', students: 120, completion: 85 },
  { name: 'Data Structures', students: 78, completion: 72 },
  { name: 'Web Development', students: 95, completion: 90 },
  { name: 'Machine Learning', students: 62, completion: 45 },
  { name: 'Advanced Mathematics', students: 55, completion: 60 },
];

const lineData = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    logins: Math.floor(Math.random() * 80) + 20,
    courseViews: Math.floor(Math.random() * 150) + 50,
    examStarts: Math.floor(Math.random() * 30) + 5,
  };
});

const engagementData = [
  { name: 'Morning (6AM-12PM)', value: 35, color: '#3f51b5' },
  { name: 'Afternoon (12PM-5PM)', value: 45, color: '#ff6e40' },
  { name: 'Evening (5PM-10PM)', value: 60, color: '#00bcd4' },
  { name: 'Night (10PM-6AM)', value: 25, color: '#e0e0e0' },
];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch required data
  const { data: students = [] } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  const { data: exams = [] } = useQuery({
    queryKey: ["/api/exams"],
  });
  
  const { data: activityLogs = [] } = useQuery({
    queryKey: ["/api/activity-logs/tenant"],
  });
  
  // Count only student users
  const studentCount = students.filter((user: any) => user.role === "student").length;
  
  // Handle export report
  const handleExportReport = () => {
    toast({
      title: "Feature coming soon",
      description: "Report export functionality will be available soon."
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-heading font-semibold">Reports & Analytics</h1>
          <Button variant="outline" className="gap-2" onClick={handleExportReport}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
        <p className="text-neutral-medium">
          Welcome back, {user?.firstName}. Here's your analytics overview.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-semibold">{studentCount}</h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <h3 className="text-2xl font-semibold">{courses.length}</h3>
            </div>
            <div className="bg-accent/10 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <h3 className="text-2xl font-semibold">{exams.length}</h3>
            </div>
            <div className="bg-secondary/10 p-3 rounded-full">
              <ClipboardList className="h-6 w-6 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Activity Logs</p>
              <h3 className="text-2xl font-semibold">{activityLogs.length}</h3>
            </div>
            <div className="bg-warning/10 p-3 rounded-full">
              <Activity className="h-6 w-6 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Platform Activity (Last 7 Days)
                </CardTitle>
                <CardDescription>
                  Daily logins, course views, and exam starts
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={lineData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="logins" stroke="#3f51b5" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="courseViews" stroke="#00bcd4" />
                      <Line type="monotone" dataKey="examStarts" stroke="#ff6e40" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Course Completion Status
                </CardTitle>
                <CardDescription>
                  Overall completion rate across all courses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Top Courses by Enrollment
              </CardTitle>
              <CardDescription>
                Number of students enrolled and completion rate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#3f51b5" />
                    <YAxis yAxisId="right" orientation="right" stroke="#ff6e40" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="students" name="Students Enrolled" fill="#3f51b5" />
                    <Bar yAxisId="right" dataKey="completion" name="Completion Rate (%)" fill="#ff6e40" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance Analysis</CardTitle>
              <CardDescription>
                Detailed metrics for each course
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Course analytics being generated
                </h3>
                <p className="text-gray-500">
                  Detailed course analytics will be available here as more data is collected.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Engagement Metrics</CardTitle>
              <CardDescription>
                Detailed engagement data by time of day
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={engagementData}
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
                    <Bar dataKey="value" name="Activity Level" radius={[4, 4, 0, 0]}>
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Analysis</CardTitle>
              <CardDescription>
                Detailed performance metrics for students
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Student performance data being collected
                </h3>
                <p className="text-gray-500">
                  Detailed student performance analytics will be available here as more exam data is collected.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Activity Logs</CardTitle>
              <CardDescription>
                Detailed activity logs for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Activity log analysis
                </h3>
                <p className="text-gray-500">
                  Detailed activity log analysis will be available here as more platform usage data is collected.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
