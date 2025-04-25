import { useState } from "react";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ExamEditor from "@/components/exams/exam-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash, 
  MoreVertical,
  ClipboardList,
  Clock,
  Calendar,
  ArrowUpRight
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
import { format } from "date-fns";

export default function AdminExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["/api/exams"],
  });
  
  // Fetch courses for the dropdown in exam editor
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Delete exam mutation
  const deleteMutation = useMutation({
    mutationFn: async (examId: number) => {
      await apiRequest("DELETE", `/api/exams/${examId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/exams"]});
      toast({
        title: "Exam deleted",
        description: "The exam has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was an error deleting the exam.",
        variant: "destructive",
      });
    }
  });
  
  // Handle opening the exam editor for creation
  const handleCreateExam = () => {
    setSelectedExam(null);
    setIsEditorOpen(true);
  };
  
  // Handle opening the exam editor for editing
  const handleEditExam = (exam: any) => {
    setSelectedExam(exam);
    setIsEditorOpen(true);
  };
  
  // Handle opening the delete confirmation dialog
  const handleDeleteExam = (exam: any) => {
    setSelectedExam(exam);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm deletion
  const confirmDeleteExam = () => {
    if (selectedExam) {
      deleteMutation.mutate(selectedExam.id);
    }
  };
  
  // Filter exams based on search term
  const filteredExams = exams.filter((exam: any) => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Find course name by ID
  const getCourseName = (courseId: number) => {
    const course = courses.find((c: any) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };
  
  // Determine exam status
  const getExamStatus = (exam: any) => {
    const now = new Date();
    
    if (!exam.startTime) return { label: "Draft", color: "bg-gray-100 text-gray-800" };
    
    const startTime = new Date(exam.startTime);
    const endTime = exam.endTime ? new Date(exam.endTime) : null;
    
    if (endTime && now > endTime) {
      return { label: "Completed", color: "bg-green-100 text-green-800" };
    }
    
    if (now > startTime) {
      return { label: "In Progress", color: "bg-blue-100 text-blue-800" };
    }
    
    return { label: "Upcoming", color: "bg-amber-100 text-amber-800" };
  };

  return (
    <DashboardLayout>
      <Header title="Exams" subtitle="Manage your exams and assessments" />
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search exams..."
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
          
          <Button onClick={handleCreateExam} className="gap-2 ml-auto sm:ml-0">
            <Plus size={16} />
            Create Exam
          </Button>
        </div>
      </div>
      
      {isLoadingExams ? (
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
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No exams found</h3>
          <p className="text-gray-500">
            {searchTerm ? "Try a different search term or" : "Get started by"} creating a new exam
          </p>
          <Button onClick={handleCreateExam} className="mt-4">
            Create Exam
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam: any) => {
            const status = getExamStatus(exam);
            
            return (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="font-heading text-lg">{exam.title}</CardTitle>
                      <p className="text-sm text-gray-500">{getCourseName(exam.courseId)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditExam(exam)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-blue-600">
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteExam(exam)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{exam.duration} minutes</span>
                      <span className="mx-2">•</span>
                      <span>Max Attempts: {exam.maxAttempts}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(exam.startTime)}</span>
                    </div>
                  </div>
                  
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Exam Editor Dialog */}
      <ExamEditor 
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        courses={courses}
        exam={selectedExam}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exam
              and all associated questions and student attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteExam}
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
