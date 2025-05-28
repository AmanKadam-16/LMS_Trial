import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import ExamView from "@/components/exams/exam-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Clock, 
  CalendarClock, 
  Book, 
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, isAfter } from "date-fns";

export default function StudentUpcomingExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["/api/exams"],
  });
  
  // Fetch course data for mapping course names
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Fetch past attempts
  const { data: examAttempts = [] } = useQuery({
    queryKey: ["/api/exam-attempts/user"],
  });
  
  // Find course name by ID
  const getCourseName = (courseId: number) => {
    const course = (courses as any[]).find((c) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };
  
  // Filter exams based on search term
  const filteredExams = (exams as any[]).filter((exam) => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCourseName(exam.courseId).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Determine if an exam can be taken
  const canTakeExam = (exam: any) => {
    // Only check if exam is accepting responses
    // Students can take multiple attempts as long as admin allows responses
    return exam.acceptingResponses !== false;
  };
  
  // Get exam status and color
  const getExamStatus = (exam: any) => {
    // Get attempts for this exam
    const attemptsForExam = (examAttempts as any[]).filter((attempt) => attempt.examId === exam.id);
    const hasCompletedAttempt = attemptsForExam.some((attempt) => attempt.completedAt);
    
    // Check if exam is not accepting responses
    if (exam.acceptingResponses === false) {
      return {
        label: "Not Accepting Responses",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-4 w-4 mr-1" />
      };
    }
    
    // If the exam has been completed but is still accepting responses
    if (hasCompletedAttempt) {
      return {
        label: "Available for Retake",
        color: "bg-blue-100 text-blue-800",
        icon: <CheckCircle2 className="h-4 w-4 mr-1" />
      };
    }
    
    // Default - available now
    return {
      label: "Available Now",
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle2 className="h-4 w-4 mr-1" />
    };
  };
  

  
  // Handle starting an exam
  const handleStartExam = (exam: any) => {
    if (!canTakeExam(exam)) {
      toast({
        title: "Cannot start exam",
        description: "This exam is not available at this time.",
        variant: "destructive",
      });
      return;
    }
    
    // Get attempts for this exam
    const attemptsForExam = (examAttempts as any[]).filter((attempt) => attempt.examId === exam.id);
    
    // Check if max attempts reached
    if (attemptsForExam.length >= exam.maxAttempts) {
      toast({
        title: "Maximum attempts reached",
        description: `You've already used all ${exam.maxAttempts} attempts for this exam.`,
        variant: "destructive",
      });
      return;
    }
    
    // Open the exam
    setSelectedExam(exam);
    setIsExamOpen(true);
  };

  return (
    <DashboardLayout>
      <div>
        <Header title="Upcoming Exams" subtitle="View and take your scheduled exams" />
        
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
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No exams found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try a different search term" : "There are no exams scheduled for you at the moment"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam: any) => {
              const status = getExamStatus(exam);
              const isAvailable = canTakeExam(exam);
              
              return (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="font-heading text-lg">{exam.title}</CardTitle>
                        <p className="text-sm text-gray-500">{getCourseName(exam.courseId)}</p>
                      </div>
                      <Badge className={status.color}>
                        <span className="flex items-center">
                          {status.icon}
                          {status.label}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-6 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Book className="h-4 w-4 mr-1" />
                        <span>{exam.description}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleStartExam(exam)}
                      disabled={!isAvailable}
                      className={isAvailable ? "bg-primary" : "bg-gray-300"}
                    >
                      {isAvailable ? "Start Exam" : "Not Available"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Exam View Dialog */}
        {selectedExam && (
          <ExamView
            open={isExamOpen}
            onOpenChange={setIsExamOpen}
            exam={selectedExam}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
