import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  CalendarDays, 
  Clock, 
  Users,
  GraduationCap,
  Award
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = parseInt(id);
  const queryClient = useQueryClient();

  // Interfaces
  interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    gender?: string;
    dateOfBirth: string;
    profilePhoto?: string;
    educationLevel: string;
    schoolCollege: string;
    yearOfStudy: string;
    role: string;
  }

  interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    duration: number;
    thumbnail?: string;
  }

  interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    enrolledAt: string;
    completedAt?: string;
    progress: number;
  }

  interface Batch {
    id: number;
    name: string;
    batchCode: string;
    courseId: number;
    trainerId: number;
    startDate: string;
    batchTime: string;
    description: string | null;
    maxStudents: number | null;
    isActive: boolean;
  }

  interface BatchEnrollment {
    id: number;
    batchId: number;
    userId: number;
    enrolledAt: string;
    enrolledBy: number;
    status: string;
  }

  interface Exam {
    id: number;
    title: string;
    description: string;
    courseId: number;
    duration: number;
    startTime: string;
    endTime: string;
    maxAttempts: number;
  }

  interface ExamAttempt {
    id: number;
    userId: number;
    examId: number;
    startedAt: string;
    completedAt?: string;
    score?: number;
  }

  // Fetch the student details
  const { data: student, isLoading: isLoadingStudent } = useQuery<User>({
    queryKey: [`/api/users/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch all courses
  const { data: allCourses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Fetch student's course enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: [`/api/enrollments/user/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch all batches
  const { data: allBatches = [], isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
  });

  // Fetch student's batch enrollments
  const { data: batchEnrollments = [], isLoading: isLoadingBatchEnrollments } = useQuery<BatchEnrollment[]>({
    queryKey: [`/api/batch-enrollments/user/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch exam attempts
  const { data: examAttempts = [], isLoading: isLoadingExamAttempts } = useQuery<ExamAttempt[]>({
    queryKey: [`/api/exam-attempts/user/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch all exams
  const { data: allExams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  // Get enrolled courses
  const enrolledCourses = allCourses.filter(course => 
    enrollments.some(enrollment => enrollment.courseId === course.id)
  );

  // Get enrolled batches with course info
  const enrolledBatches = allBatches.filter(batch => 
    batchEnrollments.some(enrollment => enrollment.batchId === batch.id)
  );

  // Get exam attempts with exam info
  const studentExamAttempts = examAttempts.map(attempt => {
    const exam = allExams.find(e => e.id === attempt.examId);
    return {
      ...attempt,
      exam: exam ? exam : undefined,
    };
  });

  // Get completion stats
  const completedCourses = enrollments.filter(e => e.completedAt).length;
  const averageProgress = enrollments.length > 0 
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length 
    : 0;
  
  const averageScore = studentExamAttempts.length > 0 && studentExamAttempts.some(a => a.score !== undefined)
    ? studentExamAttempts.filter(a => a.score !== undefined)
        .reduce((sum, a) => sum + (a.score || 0), 0) / 
      studentExamAttempts.filter(a => a.score !== undefined).length
    : null;

  if (isLoadingStudent || isLoadingCourses || isLoadingEnrollments || 
      isLoadingBatches || isLoadingBatchEnrollments || isLoadingExams || isLoadingExamAttempts) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-lg text-gray-500">Student not found</p>
              <Link href="/admin/students">
                <Button>Back to Students</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/students">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  {student.profilePhoto ? (
                    <AvatarImage src={student.profilePhoto} alt={`${student.firstName} ${student.lastName}`} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <CardTitle className="text-center">{student.firstName} {student.lastName}</CardTitle>
              <CardDescription className="text-center">{student.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Username:</span>
                  <span className="text-sm">{student.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Mobile:</span>
                  <span className="text-sm">{student.mobileNumber}</span>
                </div>
                {student.gender && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gender:</span>
                    <span className="text-sm">{student.gender}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Date of Birth:</span>
                  <span className="text-sm">{format(new Date(student.dateOfBirth), "PP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Education:</span>
                  <span className="text-sm">{student.educationLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">School/College:</span>
                  <span className="text-sm">{student.schoolCollege}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Year of Study:</span>
                  <span className="text-sm">{student.yearOfStudy}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Learning Progress Summary</CardTitle>
              <CardDescription>Overview of student's learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-md p-4 flex flex-col items-center">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{enrolledCourses.length}</h3>
                  <p className="text-sm text-center">Enrolled Courses</p>
                </div>
                <div className="bg-muted rounded-md p-4 flex flex-col items-center">
                  <CalendarDays className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{enrolledBatches.length}</h3>
                  <p className="text-sm text-center">Active Batches</p>
                </div>
                <div className="bg-muted rounded-md p-4 flex flex-col items-center">
                  <Award className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{completedCourses}</h3>
                  <p className="text-sm text-center">Completed Courses</p>
                </div>
                <div className="bg-muted rounded-md p-4 flex flex-col items-center">
                  <GraduationCap className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{Math.round(averageProgress)}%</h3>
                  <p className="text-sm text-center">Average Progress</p>
                </div>
                <div className="bg-muted rounded-md p-4 flex flex-col items-center">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{studentExamAttempts.length}</h3>
                  <p className="text-sm text-center">Exam Attempts</p>
                </div>
                <div className="bg-muted rounded-md p-4 flex flex-col items-center">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-xl font-bold">{averageScore !== null ? `${Math.round(averageScore)}%` : 'N/A'}</h3>
                  <p className="text-sm text-center">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
            <TabsTrigger value="batches">Batch Enrollments</TabsTrigger>
            <TabsTrigger value="exams">Exam Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="space-y-4">
            <h2 className="text-xl font-semibold">Enrolled Courses ({enrolledCourses.length})</h2>
            
            {enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-lg text-gray-500">No courses enrolled</p>
                  <p className="text-sm text-gray-400 mb-4">This student has not enrolled in any courses yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.map(course => {
                  const enrollment = enrollments.find(e => e.courseId === course.id);
                  return (
                    <Card key={course.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <Badge>{course.difficulty}</Badge>
                        </div>
                        <CardDescription>{course.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Enrolled on:</span>
                            <span>{enrollment ? format(new Date(enrollment.enrolledAt), "PP") : "Unknown"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Progress:</span>
                            <span>{enrollment ? `${enrollment.progress}%` : "0%"}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${enrollment ? enrollment.progress : 0}%` }}
                            ></div>
                          </div>
                          {enrollment?.completedAt && (
                            <div className="flex justify-between text-sm">
                              <span>Completed on:</span>
                              <span>{format(new Date(enrollment.completedAt), "PP")}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/admin/courses/${course.id}`}>
                          <Button variant="outline" size="sm" className="w-full">View Course Details</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="batches" className="space-y-4">
            <h2 className="text-xl font-semibold">Batch Enrollments ({enrolledBatches.length})</h2>
            
            {enrolledBatches.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-lg text-gray-500">No batch enrollments</p>
                  <p className="text-sm text-gray-400 mb-4">This student is not enrolled in any batches</p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledBatches.map(batch => {
                      const batchEnrollment = batchEnrollments.find(be => be.batchId === batch.id);
                      const course = allCourses.find(c => c.id === batch.courseId);
                      
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.name}</TableCell>
                          <TableCell>{batch.batchCode}</TableCell>
                          <TableCell>{course?.title || "Unknown"}</TableCell>
                          <TableCell>{format(new Date(batch.startDate), "PP")}</TableCell>
                          <TableCell>{batch.batchTime}</TableCell>
                          <TableCell>
                            <Badge variant={batchEnrollment?.status === "active" ? "default" : "secondary"}>
                              {batchEnrollment?.status || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/batches/${batch.id}`}>
                              <Button variant="outline" size="sm">View Batch</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="exams" className="space-y-4">
            <h2 className="text-xl font-semibold">Exam Results ({studentExamAttempts.length})</h2>
            
            {studentExamAttempts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Award className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-lg text-gray-500">No exam attempts</p>
                  <p className="text-sm text-gray-400 mb-4">This student has not attempted any exams yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Started On</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentExamAttempts.map(attempt => {
                      const course = attempt.exam ? allCourses.find(c => c.id === attempt.exam.courseId) : null;
                      const isCompleted = !!attempt.completedAt;
                      
                      return (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">{attempt.exam?.title || "Unknown Exam"}</TableCell>
                          <TableCell>{course?.title || "Unknown"}</TableCell>
                          <TableCell>{format(new Date(attempt.startedAt), "PP")}</TableCell>
                          <TableCell>
                            {attempt.completedAt ? format(new Date(attempt.completedAt), "PP") : "Not completed"}
                          </TableCell>
                          <TableCell>
                            {attempt.score !== undefined ? `${attempt.score}%` : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCompleted ? "default" : "secondary"}>
                              {isCompleted ? "Completed" : "In Progress"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {attempt.exam ? (
                              <Link href={`/admin/exams/${attempt.exam.id}`}>
                                <Button variant="outline" size="sm">View Exam</Button>
                              </Link>
                            ) : (
                              <Button variant="outline" size="sm" disabled>View Exam</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}