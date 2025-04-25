import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  ArrowRight,
  ArrowUpRight,
  PlayCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function StudentMyCourses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("enrolled");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch all courses
  const { data: allCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Fetch enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments/user"],
  });
  
  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", "/api/enrollments", { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/enrollments/user"]});
      toast({
        title: "Enrolled successfully",
        description: "You have successfully enrolled in the course.",
      });
    },
    onError: () => {
      toast({
        title: "Enrollment failed",
        description: "There was an error enrolling in the course.",
        variant: "destructive",
      });
    }
  });
  
  // Handle enrollment
  const handleEnroll = (courseId: number) => {
    enrollMutation.mutate(courseId);
  };
  
  // Get enrolled and available courses
  const enrolledCourseIds = (enrollments as any[]).map((enrollment) => enrollment.courseId);
  const enrolledCourses = (allCourses as any[]).filter((course) => 
    enrolledCourseIds.includes(course.id)
  );
  const availableCourses = (allCourses as any[]).filter((course) => 
    !enrolledCourseIds.includes(course.id)
  );
  
  // Filter courses based on search term
  const filteredEnrolledCourses = enrolledCourses.filter((course: any) => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredAvailableCourses = availableCourses.filter((course: any) => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Helper function to get badge color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Find enrollment data for a course
  const getEnrollmentData = (courseId: number) => {
    return (enrollments as any[]).find((e) => e.courseId === courseId);
  };

  return (
    <DashboardLayout>
      <div>
        <Header title="My Courses" subtitle="View your enrolled courses and browse available ones" />
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search courses..."
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="enrolled">My Enrolled Courses</TabsTrigger>
            <TabsTrigger value="available">Available Courses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enrolled">
            {isLoadingEnrollments || isLoadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200"></div>
                    <CardHeader className="pb-3">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="h-2 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEnrolledCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchTerm ? "No matching enrolled courses" : "No enrolled courses yet"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Try a different search term or browse available courses" 
                    : "Browse available courses to start your learning journey"}
                </p>
                <Button onClick={() => setActiveTab("available")}>
                  Browse Available Courses
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnrolledCourses.map((course: any) => {
                  const enrollment = getEnrollmentData(course.id);
                  const progress = enrollment?.progress || 0;
                  
                  return (
                    <Card key={course.id} className="overflow-hidden">
                      <div className="h-32 bg-primary/10 relative flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/60" />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-green-100 text-green-800">
                            Enrolled
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="pt-6 pb-3">
                        <CardTitle className="font-heading text-lg line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                        
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                            {course.difficulty}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100">
                            {course.category}
                          </Badge>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="border-t pt-4">
                        <Link href={`/student/my-courses/${course.id}`} className="w-full">
                          <Button className="w-full gap-2">
                            {progress > 0 ? (
                              <>
                                <PlayCircle className="h-4 w-4" />
                                Continue Learning
                              </>
                            ) : (
                              <>
                                <ArrowRight className="h-4 w-4" />
                                Start Course
                              </>
                            )}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="available">
            {isLoadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200"></div>
                    <CardHeader className="pb-3">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="h-2 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAvailableCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchTerm ? "No matching available courses" : "No more courses available"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? "Try a different search term" 
                    : "You're enrolled in all available courses!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableCourses.map((course: any) => (
                  <Card key={course.id} className="overflow-hidden">
                    <div className="h-32 bg-neutral-100 relative flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-neutral-400" />
                    </div>
                    
                    <CardHeader className="pt-6 pb-3">
                      <CardTitle className="font-heading text-lg line-clamp-2">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                          {course.difficulty}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-100">
                          {course.category}
                        </Badge>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-4 flex justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{course.duration} weeks</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollMutation.isPending}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        Enroll
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
