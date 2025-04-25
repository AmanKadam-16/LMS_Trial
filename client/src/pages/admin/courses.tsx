import { useState } from "react";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CourseEditor from "@/components/courses/course-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash, 
  MoreVertical,
  BookOpen,
  Clock,
  Users
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch courses
  const { data: courses = [] as any[], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/courses"]});
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error deleting the course.",
        variant: "destructive",
      });
    }
  });
  
  // Handle opening the course editor for creation
  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsEditorOpen(true);
  };
  
  // Handle opening the course editor for editing
  const handleEditCourse = async (course: any) => {
    // Fetch the full course data to make sure we have the latest information
    try {
      console.log("Editing course:", course);
      const response = await apiRequest("GET", `/api/courses/${course.id}`);
      const fullCourseData = await response.json();
      console.log("Fetched course data:", fullCourseData);
      setSelectedCourse(fullCourseData);
      console.log("Set selected course to:", fullCourseData);
      setIsEditorOpen(true);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch course details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle opening the delete confirmation dialog
  const handleDeleteCourse = (course: any) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm deletion
  const confirmDeleteCourse = () => {
    if (selectedCourse) {
      deleteMutation.mutate(selectedCourse.id);
    }
  };
  
  // Filter courses based on search term
  const filteredCourses = courses.filter((course: any) => 
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

  return (
    <DashboardLayout>
      <Header title="Courses" subtitle="Manage your courses and curriculum" />
      
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
          
          <Button onClick={handleCreateCourse} className="gap-2 ml-auto sm:ml-0">
            <Plus size={16} />
            Add Course
          </Button>
        </div>
      </div>
      
      {isLoadingCourses ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-gray-200"></CardHeader>
              <CardContent className="pt-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
          <p className="text-gray-500">
            {searchTerm ? "Try a different search term or" : "Get started by"} creating a new course
          </p>
          <Button onClick={handleCreateCourse} className="mt-4">
            Create Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="h-32 bg-primary/10 relative flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-primary/60" />
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.location.href = `/admin/courses/${course.id}/progress`}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Student Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCourse(course)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardHeader className="pt-6 pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-heading text-lg line-clamp-2">
                    {course.title}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                  {course.description}
                </p>
                
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
                
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>0 students</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Course Editor Dialog */}
      <CourseEditor 
        key={selectedCourse?.id || 'new-course'}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        course={selectedCourse}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and remove all associated data including modules, lessons, and student enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
