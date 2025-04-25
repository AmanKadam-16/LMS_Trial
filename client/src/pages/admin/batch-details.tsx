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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";

export default function BatchDetailsPage() {
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const { id } = useParams<{ id: string }>();
  const batchId = parseInt(id);
  const queryClient = useQueryClient();

  // Interfaces
  interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }

  interface Course {
    id: number;
    title: string;
    description: string;
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

  // Fetch the batch details
  const { data: batch, isLoading: isLoadingBatch } = useQuery<Batch>({
    queryKey: [`/api/batches/${batchId}`],
    enabled: !!batchId,
  });

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${batch?.courseId}`],
    enabled: !!batch?.courseId,
  });

  // Fetch users for trainer info and student enrollment
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch batch enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<BatchEnrollment[]>({
    queryKey: [`/api/batches/${batchId}/enrollments`],
    enabled: !!batchId,
  });

  // Get trainer info
  const trainer = users?.find(user => user.id === batch?.trainerId);

  // Get enrolled students
  const enrolledUserIds = enrollments.map(enrollment => enrollment.userId);
  const enrolledStudents = users?.filter(user => 
    enrolledUserIds.includes(user.id) && user.role === 'student'
  ) || [];

  // Get available students (not yet enrolled)
  const availableStudents = users?.filter(user => 
    user.role === 'student' && !enrolledUserIds.includes(user.id)
  ) || [];

  // Mutation for batch enrollment
  const enrollStudentsMutation = useMutation({
    mutationFn: async ({ batchId, userIds }: { batchId: number; userIds: number[] }) => {
      return await apiRequest("POST", "/api/batch-enrollments/bulk", { batchId, userIds });
    },
    onSuccess: () => {
      toast({
        title: "Students enrolled",
        description: "Students have been enrolled to the batch successfully.",
      });
      setOpenEnrollDialog(false);
      setSelectedStudents([]);
      queryClient.invalidateQueries({ queryKey: [`/api/batches/${batchId}/enrollments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enroll students",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Mutation for removing a student from batch
  const removeStudentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      return await apiRequest("DELETE", `/api/batch-enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Student removed",
        description: "Student has been removed from the batch successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/batches/${batchId}/enrollments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove student",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Toggle student selection for enrollment
  function toggleStudentSelection(studentId: number) {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  }

  // Handle student enrollment
  function enrollStudents() {
    if (selectedStudents.length > 0) {
      enrollStudentsMutation.mutate({ batchId, userIds: selectedStudents });
    } else {
      toast({
        title: "No students selected",
        description: "Please select at least one student to enroll.",
        variant: "destructive",
      });
    }
  }

  // Handle student removal
  function removeStudent(enrollmentId: number) {
    if (confirm("Are you sure you want to remove this student from the batch?")) {
      removeStudentMutation.mutate(enrollmentId);
    }
  }

  if (isLoadingBatch || isLoadingCourse || isLoadingUsers || isLoadingEnrollments) {
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

  if (!batch) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-lg text-gray-500">Batch not found</p>
              <Link href="/admin/batches">
                <Button>Back to Batches</Button>
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
          <Link href="/admin/batches">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{batch.name}</h1>
              <p className="text-gray-500">Batch Code: {batch.batchCode}</p>
            </div>
            <Badge variant={batch.isActive ? "default" : "secondary"}>
              {batch.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Batch Details</CardTitle>
              <CardDescription>Overview of the batch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Course:</span>
                  <span className="text-sm">{course?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Trainer:</span>
                  <span className="text-sm">
                    {trainer ? `${trainer.firstName} ${trainer.lastName}` : "Not assigned"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Start Date:</span>
                  <span className="text-sm">{format(new Date(batch.startDate), "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Batch Time:</span>
                  <span className="text-sm">{batch.batchTime}</span>
                </div>
                {batch.maxStudents && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Maximum Students:</span>
                    <span className="text-sm">{batch.maxStudents}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Enrolled Students:</span>
                  <span className="text-sm">{enrolledStudents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Description</CardTitle>
              <CardDescription>About this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{batch.description || "No description provided."}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList>
            <TabsTrigger value="students">Enrolled Students</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Enrolled Students ({enrolledStudents.length})</h2>
              <Dialog open={openEnrollDialog} onOpenChange={setOpenEnrollDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Enroll Students
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[725px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enroll Students to Batch</DialogTitle>
                    <DialogDescription>
                      Select students to enroll in this batch. Students will also be enrolled in the
                      associated course.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <h3 className="font-medium mb-2">Available Students:</h3>
                    {availableStudents.length === 0 ? (
                      <p className="text-sm text-gray-500">No more students available to enroll.</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {availableStudents.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                            <label
                              htmlFor={`student-${student.id}`}
                              className="flex-grow cursor-pointer"
                            >
                              <div className="font-medium">{student.firstName} {student.lastName}</div>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      disabled={
                        enrollStudentsMutation.isPending || 
                        selectedStudents.length === 0
                      }
                      onClick={enrollStudents}
                    >
                      {enrollStudentsMutation.isPending ? "Enrolling..." : "Enroll Selected Students"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {enrolledStudents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="mb-4 text-lg text-gray-500">No students enrolled in this batch yet</p>
                  <Button onClick={() => setOpenEnrollDialog(true)}>
                    Enroll Your First Student
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Enrolled On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledStudents.map((student) => {
                      const enrollment = enrollments.find(e => e.userId === student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>
                            {enrollment?.enrolledAt 
                              ? format(new Date(enrollment.enrolledAt), "PP") 
                              : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={enrollment?.status === "active" ? "default" : "secondary"}>
                              {enrollment?.status || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => enrollment && removeStudent(enrollment.id)}
                              disabled={removeStudentMutation.isPending}
                            >
                              {removeStudentMutation.isPending ? "Removing..." : "Remove"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Student performance data for this batch</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Performance metrics will be available as students progress through the course.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}