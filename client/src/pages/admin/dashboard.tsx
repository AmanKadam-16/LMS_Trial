import { useEffect } from "react";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatCard from "@/components/dashboard/stat-card";
import ActivityChart from "@/components/dashboard/activity-chart";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import RecentActivities from "@/components/dashboard/recent-activities";
import UpcomingExams from "@/components/dashboard/upcoming-exams";
import { Users, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Sample activity data
  const activityData = [
    { day: 'Mon', percentage: 40 },
    { day: 'Tue', percentage: 65 },
    { day: 'Wed', percentage: 85 },
    { day: 'Thu', percentage: 95, isCurrentDay: true },
    { day: 'Fri', percentage: 75 },
    { day: 'Sat', percentage: 50 },
    { day: 'Sun', percentage: 30 },
  ];
  
  // Sample course performance data
  const coursePerformance = [
    { name: 'Introduction to Programming', percentage: 87 },
    { name: 'Data Structures', percentage: 74 },
    { name: 'Advanced Mathematics', percentage: 65 },
    { name: 'Web Development Basics', percentage: 92 },
    { name: 'Machine Learning', percentage: 51 },
  ];
  
  // Sample recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'new-course',
      title: 'New Course Added',
      description: 'Advanced Web Development with React',
      time: '2h ago',
    },
    {
      id: 2,
      type: 'exam-results',
      title: 'Exam Results Published',
      description: 'Data Structures Mid-Term Examination',
      time: '5h ago',
    },
    {
      id: 3,
      type: 'deadline',
      title: 'Deadline Reminder',
      description: 'Machine Learning Project Submission',
      time: '1d ago',
    },
    {
      id: 4,
      type: 'new-students',
      title: 'New Students Enrolled',
      description: '15 new students joined Advanced Mathematics',
      time: '2d ago',
    },
  ];
  
  // Sample upcoming exams
  const upcomingExams = [
    {
      id: 1,
      title: 'Data Structures',
      subtitle: 'Final Examination',
      urgency: 'high',
      urgencyLabel: 'Tomorrow',
      time: '09:00 AM - 11:00 AM',
    },
    {
      id: 2,
      title: 'Web Development',
      subtitle: 'Mid-Term Quiz',
      urgency: 'medium',
      urgencyLabel: 'In 3 days',
      time: '02:00 PM - 03:30 PM',
    },
    {
      id: 3,
      title: 'Machine Learning',
      subtitle: 'Project Presentation',
      urgency: 'low',
      urgencyLabel: 'Next week',
      time: '10:00 AM - 01:00 PM',
    },
  ];

  // Fetch dashboard data
  const { data: students } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });
  
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });
  
  const { data: exams } = useQuery({
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

  return (
    <DashboardLayout>
      <Header title="Dashboard" />
      
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Students" 
            value={students?.length || 0} 
            change={{ value: "12%", positive: true }}
            icon={<Users />}
            iconColor="primary"
          />
          
          <StatCard 
            title="Active Courses" 
            value={courses?.length || 0} 
            change={{ value: "4%", positive: true }}
            icon={<BookOpen />}
            iconColor="accent"
          />
          
          <StatCard 
            title="Upcoming Exams" 
            value={exams?.length || 0} 
            change={{ value: "2", positive: false }}
            icon={<Calendar />}
            iconColor="secondary"
          />
        </div>
      </div>
      
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityChart 
          data={activityData} 
          changePercentage="18.2%" 
          isPositiveChange={true}
          className="lg:col-span-2"
        />
        
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
          onScheduleExam={() => {
            toast({
              title: "Coming soon",
              description: "Use the Exams page to schedule a new exam."
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
