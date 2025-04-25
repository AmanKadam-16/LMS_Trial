import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MoreVertical,
  Users,
  Mail,
  Eye,
  BarChart,
  GraduationCap,
  BookOpen,
  Plus
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch students (users with role "student")
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Course assignment mutation
  const assignCourseMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: number, courseId: number }) => {
      await apiRequest("POST", "/api/enrollments/assign", { 
        userId, 
        courseId 
      });
    },
    onSuccess: () => {
      toast({
        title: "Course assigned",
        description: `Course has been successfully assigned to ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
      });
      setIsAssignDialogOpen(false);
      setSelectedCourseId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign course",
        description: error.message || "There was an error assigning the course",
        variant: "destructive",
      });
    }
  });
  
  // Handle assigning course to student
  const handleAssignCourse = () => {
    if (!selectedStudent || !selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course to assign",
        variant: "destructive",
      });
      return;
    }
    
    assignCourseMutation.mutate({
      userId: selectedStudent.id,
      courseId: parseInt(selectedCourseId)
    });
  };
  
  // Open assign course dialog
  const openAssignDialog = (student: any) => {
    setSelectedStudent(student);
    setIsAssignDialogOpen(true);
  };
  
  // Filter only students
  const students = (allUsers as any[]).filter((user) => user.role === "student");
  
  // Filter students based on search term
  const filteredStudents = students.filter((student: any) => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Handle view student details - now implemented
  const handleViewStudent = (student: any) => {
    window.location.href = `/admin/students/${student.id}`;
  };
  
  // Handle view student performance
  const handleViewPerformance = (student: any) => {
    toast({
      title: "Feature coming soon",
      description: `View performance for ${student.firstName} ${student.lastName}`,
    });
  };
  
  // Handle send email
  const handleSendEmail = (student: any) => {
    toast({
      title: "Feature coming soon",
      description: `Send email to ${student.email}`,
    });
  };

  return (
    <DashboardLayout>
      <Header title="Students" subtitle="Manage and monitor student accounts" />
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search students..."
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
          
          <Button 
            variant="outline" 
            className={view === "table" ? "bg-muted" : ""}
            onClick={() => setView("table")}
          >
            <BarChart size={16} />
          </Button>
          
          <Button 
            variant="outline" 
            className={view === "grid" ? "bg-muted" : ""}
            onClick={() => setView("grid")}
          >
            <Users size={16} />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
          <p className="text-gray-500">
            {searchTerm ? "Try a different search term" : "No students have registered yet"}
          </p>
        </div>
      ) : view === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(student.firstName, student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{student.firstName} {student.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/students/${student.id}`} className="w-full">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleViewPerformance(student)}>
                            <BarChart className="mr-2 h-4 w-4" />
                            View Performance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(student)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openAssignDialog(student)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Assign Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student: any) => (
            <Card key={student.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">
                      {getInitials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium text-base">{student.firstName} {student.lastName}</h3>
                    <p className="text-sm text-gray-500">{student.username}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    <Badge className="mt-1 bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
                
                <div className="flex mt-4 space-x-2">
                  <Link href={`/admin/students/${student.id}`} className="flex-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleViewPerformance(student)}
                  >
                    <BarChart className="h-4 w-4 mr-1" />
                    Performance
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleSendEmail(student)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
                <Button 
                  size="sm"
                  variant="secondary" 
                  className="w-full mt-2"
                  onClick={() => openAssignDialog(student)}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Assign Course
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialog for assigning courses */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Course to Student</DialogTitle>
            <DialogDescription>
              {selectedStudent && 
                `Assign a course to ${selectedStudent.firstName} ${selectedStudent.lastName}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="course" className="text-sm font-medium">
                Select Course
              </label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {(courses as any[])
                    .filter((course) => course.isEnrollmentRequired)
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignCourse}
              disabled={!selectedCourseId || assignCourseMutation.isPending}
            >
              {assignCourseMutation.isPending ? "Assigning..." : "Assign Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
