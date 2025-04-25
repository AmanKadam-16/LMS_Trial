import { useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import StatCard from "@/components/dashboard/stat-card";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import RecentActivities from "@/components/dashboard/recent-activities";
import UpcomingExams from "@/components/dashboard/upcoming-exams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  CheckCircle,
  ArrowUpRight 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Sample course performance data
  const coursePerformance = [
    { name: 'Introduction to Programming', percentage: 87 },
    { name: 'Data Structures', percentage: 74 },
    { name: 'Advanced Mathematics', percentage: 65 },
    { name: 'Web Development Basics', percentage: 92 },
  ];
  
  // Sample recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'new-course' as const,
      title: 'New Course Available',
      description: 'Advanced Web Development with React',
      time: '2h ago',
    },
    {
      id: 2,
      type: 'exam-results' as const,
      title: 'Exam Results Available',
      description: 'Data Structures Mid-Term Examination',
      time: '5h ago',
    },
    {
      id: 3,
      type: 'deadline' as const,
      title: 'Upcoming Deadline',
      description: 'Machine Learning Project Submission',
      time: '1d ago',
    },
  ];
  
  // Sample upcoming exams
  const upcomingExams = [
    {
      id: 1,
      title: 'Data Structures',
      subtitle: 'Final Examination',
      urgency: 'high' as const,
      urgencyLabel: 'Tomorrow',
      time: '09:00 AM - 11:00 AM',
    },
    {
      id: 2,
      title: 'Web Development',
      subtitle: 'Mid-Term Quiz',
      urgency: 'medium' as const,
      urgencyLabel: 'In 3 days',
      time: '02:00 PM - 03:30 PM',
    },
    {
      id: 3,
      title: 'Machine Learning',
      subtitle: 'Project Presentation',
      urgency: 'low' as const,
      urgencyLabel: 'Next week',
      time: '10:00 AM - 01:00 PM',
    },
  ];

  // Fetch enrollment data
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments/user"],
    enabled: !!user,
  });
  
  // Fetch all available courses
  const { data: allCourses = [] } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });
  
  // Fetch exams
  const { data: exams = [] } = useQuery({
    queryKey: ["/api/exams"],
    enabled: !!user,
  });

  // Log activity on dashboard visit
  useEffect(() => {
    if (user) {
      const logActivity = async () => {
        try {
          await apiRequest("POST", "/api/activity-logs", {
            activityType: "dashboard_view",
            resourceId: 0,
            resourceType: "dashboard"
          });
        } catch (error) {
          // Silent fail - activity logging shouldn't disrupt user experience
        }
      };
      
      logActivity();
    }
  }, [user]);

  // Get enrolled and available courses
  const enrolledCourseIds = (enrollments as any[]).map((enrollment) => enrollment.courseId);
  const enrolledCourses = (allCourses as any[]).filter((course) => 
    enrolledCourseIds.includes(course.id)
  );
  const availableCourses = (allCourses as any[]).filter((course) => 
    !enrolledCourseIds.includes(course.id)
  );

  return (
    <DashboardLayout>
      <div>
        <Header 
          title="Student Dashboard" 
          subtitle={`Welcome back, ${user?.firstName}. Here's your learning progress.`}
        />
        
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Enrolled Courses" 
              value={enrolledCourses.length} 
              icon={<BookOpen />}
              iconColor="primary"
            />
            
            <StatCard 
              title="Completed Courses" 
              value={0} 
              icon={<GraduationCap />}
              iconColor="accent"
            />
            
            <StatCard 
              title="Upcoming Exams" 
              value={(exams as any[]).length} 
              icon={<Clock />}
              iconColor="secondary"
            />
          </div>
        </div>
        
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Your enrolled and in-progress courses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEnrollments ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No courses enrolled</h3>
                  <p className="text-gray-500 mb-4">
                    Browse available courses and start your learning journey
                  </p>
                  <Link href="/student/my-courses">
                    <Button>Browse Courses</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrolledCourses.map((course: any, index: number) => {
                    // Get enrollment data
                    const enrollment = (enrollments as any[]).find((e) => e.courseId === course.id);
                    const progress = enrollment?.progress || 0;
                    
                    return (
                      <div key={course.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{course.title}</h3>
                            <p className="text-sm text-gray-500">{course.description.substring(0, 100)}...</p>
                          </div>
                          <Link href={`/student/my-courses/${course.id}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <ArrowUpRight className="h-4 w-4" />
                              Continue
                            </Button>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Progress value={progress} className="flex-1" />
                          <span className="text-sm">{progress}% complete</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="text-center pt-4">
                    <Link href="/student/my-courses">
                      <Button variant="outline">View All Courses</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <PerformanceMetrics 
            courses={coursePerformance}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivities 
            activities={recentActivities}
            className="lg:col-span-2"  
          />
          
          <UpcomingExams 
            exams={upcomingExams}
            showScheduleButton={false}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
