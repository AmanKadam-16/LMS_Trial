import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  BarChart2, 
  Award,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function StudentResults() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("exams");
  
  // Fetch exam attempts
  const { data: examAttempts = [], isLoading: isLoadingAttempts } = useQuery({
    queryKey: ["/api/exam-attempts/user"],
  });
  
  // Fetch exams for mapping
  const { data: exams = [] } = useQuery({
    queryKey: ["/api/exams"],
  });
  
  // Fetch courses for mapping
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Fetch enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/enrollments/user"],
  });
  
  // Find exam by ID
  const getExamById = (examId: number) => {
    return (exams as any[]).find((exam) => exam.id === examId);
  };
  
  // Find course by ID
  const getCourseById = (courseId: number) => {
    return (courses as any[]).find((course) => course.id === courseId);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };
  
  // Filter exam attempts based on search term
  const filteredAttempts = (examAttempts as any[]).filter((attempt) => {
    const exam = getExamById(attempt.examId);
    if (!exam) return false;
    
    const course = getCourseById(exam.courseId);
    
    return exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course && course.title.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Sort attempts by date (most recent first)
  const sortedAttempts = [...filteredAttempts].sort((a, b) => 
    new Date(b.completedAt || b.startedAt).getTime() - 
    new Date(a.completedAt || a.startedAt).getTime()
  );
  
  // Get badge color based on score
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  // Calculate average score
  const averageScore = sortedAttempts.length > 0 
    ? Math.round(sortedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / sortedAttempts.length) 
    : 0;
  
  // Prepare chart data
  const scoreDistribution = [
    { name: "0-49", value: 0, color: "#f44336" },
    { name: "50-69", value: 0, color: "#ff9800" },
    { name: "70-89", value: 0, color: "#4caf50" },
    { name: "90-100", value: 0, color: "#2196f3" },
  ];
  
  sortedAttempts.forEach((attempt: any) => {
    if (!attempt.score) return;
    
    if (attempt.score < 50) {
      scoreDistribution[0].value++;
    } else if (attempt.score < 70) {
      scoreDistribution[1].value++;
    } else if (attempt.score < 90) {
      scoreDistribution[2].value++;
    } else {
      scoreDistribution[3].value++;
    }
  });
  
  // Chart data for progress over time
  const progressData = sortedAttempts
    .filter((attempt: any) => attempt.completedAt && attempt.score !== undefined)
    .slice(0, 10)  // Get the last 10 completed attempts
    .reverse()     // Reverse to show chronological order
    .map((attempt: any) => {
      const exam = getExamById(attempt.examId);
      return {
        name: exam?.title?.substring(0, 15) || `Exam ${attempt.examId}`,
        score: attempt.score,
        date: format(new Date(attempt.completedAt), "MMM d"),
      };
    });

  // Course progress data
  const courseProgressData = (enrollments as any[]).map((enrollment) => {
    const course = getCourseById(enrollment.courseId);
    return {
      name: course?.title || `Course ${enrollment.courseId}`,
      progress: enrollment.progress || 0,
    };
  });

  return (
    <DashboardLayout>
      <div>
        <Header title="Results & Progress" subtitle="Track your exam results and overall progress" />
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search results..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="gap-2">
              <Filter size={16} />
              Filter
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <h3 className="text-2xl font-semibold">{averageScore}%</h3>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Exams Taken</p>
                <h3 className="text-2xl font-semibold">{sortedAttempts.filter(a => a.completedAt).length}</h3>
              </div>
              <div className="bg-accent/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                <h3 className="text-2xl font-semibold">{(enrollments as any[]).length}</h3>
              </div>
              <div className="bg-secondary/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Highest Score</p>
                <h3 className="text-2xl font-semibold">
                  {Math.max(...sortedAttempts.map(a => a.score || 0), 0)}%
                </h3>
              </div>
              <div className="bg-warning/10 p-3 rounded-full">
                <BarChart2 className="h-6 w-6 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="exams">Exam Results</TabsTrigger>
            <TabsTrigger value="progress">Course Progress</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="exams">
            {isLoadingAttempts ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-6 bg-gray-200 rounded mb-2 w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </CardHeader>
                    <CardContent className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedAttempts.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No exam results yet</h3>
                <p className="text-gray-500">
                  Complete some exams to see your results here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAttempts.map((attempt: any) => {
                  const exam = getExamById(attempt.examId);
                  if (!exam) return null;
                  
                  const course = getCourseById(exam.courseId);
                  const isCompleted = !!attempt.completedAt;
                  
                  return (
                    <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between">
                          <div>
                            <CardTitle className="font-heading text-lg">{exam.title}</CardTitle>
                            <p className="text-sm text-gray-500">{course?.title || "Unknown Course"}</p>
                          </div>
                          {isCompleted && attempt.score !== undefined ? (
                            <Badge className={getScoreBadgeColor(attempt.score)}>
                              Score: {attempt.score}%
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">
                              In Progress
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-6 flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Duration: {exam.duration} minutes</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {isCompleted 
                                ? `Completed: ${formatDate(attempt.completedAt)}` 
                                : `Started: ${formatDate(attempt.startedAt)}`}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          disabled={!isCompleted}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="progress">
            {courseProgressData.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No courses enrolled</h3>
                <p className="text-gray-500">
                  Enroll in courses to track your progress
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {courseProgressData.map((course: { name: string, progress: number }, index: number) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <CardTitle className="font-heading text-lg">{course.name}</CardTitle>
                        <Badge className={course.progress >= 100 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                          {course.progress >= 100 ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scoreDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => 
                            percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                          }
                        >
                          {scoreDistribution.map((entry, index) => (
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
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64">
                    {progressData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={progressData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            name="Score (%)" 
                            stroke="#3f51b5" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No exam history available yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Course Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  {courseProgressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseProgressData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="progress" 
                          name="Completion (%)" 
                          fill="#00bcd4" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No course data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
