import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define the form schema for batch creation
const batchFormSchema = z.object({
  name: z.string().min(3, { message: "Batch name must be at least 3 characters" }),
  batchCode: z.string().min(2, { message: "Batch code must be at least 2 characters" }),
  courseId: z.coerce.number({ required_error: "Please select a course" }),
  trainerId: z.coerce.number({ required_error: "Please select a trainer" }),
  startDate: z.date({ required_error: "Please select a start date" }),
  batchTime: z.string().min(1, { message: "Please enter batch time" }),
  description: z.string().optional(),
  maxStudents: z.coerce.number().optional(),
  isActive: z.boolean().default(true)
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

export default function BatchesPage() {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const queryClient = useQueryClient();

  // Define interface types for API responses
  interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    tenantId: number;
  }

  interface Course {
    id: number;
    title: string;
    description: string;
    tenantId: number;
    createdBy: number;
    isEnrollmentRequired: boolean;
  }

  interface Batch {
    id: number;
    name: string;
    courseId: number;
    batchCode: string;
    trainerId: number;
    startDate: string;
    batchTime: string;
    tenantId: number;
    createdBy: number;
    description: string | null;
    maxStudents: number | null;
    isActive: boolean;
  }
  
  // Fetch batches
  const { data: batches, isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch courses for the dropdown
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch trainers (admins) for the dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Trainers are users with role 'admin'
  const trainers = users?.filter(user => user.role === 'admin' || user.role === 'superadmin') || [];
  
  // Students are users with role 'student'
  const students = users?.filter(user => user.role === 'student') || [];

  // Form for creating a new batch
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      batchCode: "",
      batchTime: "09:00 AM",
      description: "",
      isActive: true
    },
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!openCreateDialog) {
      form.reset();
    }
  }, [openCreateDialog, form]);

  // Mutation for creating a batch
  const createBatchMutation = useMutation({
    mutationFn: async (values: BatchFormValues) => {
      // Format the date for API
      const formattedValues = {
        ...values,
        startDate: format(values.startDate, "yyyy-MM-dd")
      };
      
      return await apiRequest("POST", "/api/batches", formattedValues);
    },
    onSuccess: () => {
      toast({
        title: "Batch created",
        description: "The batch has been created successfully.",
      });
      setOpenCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create batch",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

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
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enroll students",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: BatchFormValues) {
    createBatchMutation.mutate(values);
  }

  // Handle student enrollment
  function enrollStudents() {
    if (selectedBatchId && selectedStudents.length > 0) {
      enrollStudentsMutation.mutate({ batchId: selectedBatchId, userIds: selectedStudents });
    } else {
      toast({
        title: "No students selected",
        description: "Please select at least one student to enroll.",
        variant: "destructive",
      });
    }
  }

  // Toggle student selection
  function toggleStudentSelection(studentId: number) {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Batch Management</h1>
            <p className="text-gray-500">Create and manage batches for courses</p>
          </div>
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button>Create New Batch</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new batch. All students in a batch will be enrolled
                  in the associated course.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter batch name" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for the batch (e.g., "Python Full Stack - Batch 2023")
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batchCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter batch code" {...field} />
                        </FormControl>
                        <FormDescription>
                          A unique code for this batch (e.g., "SAT-2023" or "WD-B5")
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCourses ? (
                              <SelectItem value="loading" disabled>
                                Loading courses...
                              </SelectItem>
                            ) : (
                              courses?.map((course) => (
                                <SelectItem
                                  key={course.id}
                                  value={course.id.toString()}
                                >
                                  {course.title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Course that will be taught in this batch
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trainerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a trainer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingUsers ? (
                              <SelectItem value="loading" disabled>
                                Loading trainers...
                              </SelectItem>
                            ) : (
                              trainers.map((trainer) => (
                                <SelectItem
                                  key={trainer.id}
                                  value={trainer.id.toString()}
                                >
                                  {trainer.firstName} {trainer.lastName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Admin who will be responsible for this batch
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${
                                    !field.value && "text-muted-foreground"
                                  }`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batchTime"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Batch Time</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 09:00 AM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter batch description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxStudents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Students (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter maximum number of students"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Batch</FormLabel>
                          <FormDescription>
                            Is this batch currently active?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={createBatchMutation.isPending}>
                      {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingBatches ? (
          <div className="flex justify-center p-8">
            <p>Loading batches...</p>
          </div>
        ) : batches?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-lg text-gray-500">No batches created yet</p>
              <Button onClick={() => setOpenCreateDialog(true)}>
                Create Your First Batch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches?.map((batch) => {
                  const course = courses?.find(c => c.id === batch.courseId);
                  const trainer = trainers?.find(t => t.id === batch.trainerId);
                  
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{course?.title || "Unknown Course"}</TableCell>
                      <TableCell>
                        {trainer ? `${trainer.firstName} ${trainer.lastName}` : "Unknown Trainer"}
                      </TableCell>
                      <TableCell>
                        {new Date(batch.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{batch.batchTime}</TableCell>
                      <TableCell>
                        <Badge variant={batch.isActive ? "default" : "secondary"}>
                          {batch.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/admin/batches/${batch.id}`}>
                            <Button variant="default" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBatchId(batch.id);
                              setOpenEnrollDialog(true);
                            }}
                          >
                            Enroll Students
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Enrollment Dialog */}
        <Dialog open={openEnrollDialog} onOpenChange={setOpenEnrollDialog}>
          <DialogContent className="sm:max-w-[725px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enroll Students to Batch</DialogTitle>
              <DialogDescription>
                Select students to enroll in this batch. Students will also be enrolled in the
                associated course.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Show selected batch details */}
              {selectedBatchId && batches && (
                <div className="rounded-md bg-muted p-4">
                  <h3 className="font-medium">Selected Batch:</h3>
                  <p>
                    {batches.find(b => b.id === selectedBatchId)?.name} - 
                    {courses?.find(c => c.id === batches.find(b => b.id === selectedBatchId)?.courseId)?.title}
                  </p>
                </div>
              )}

              {students.length === 0 ? (
                <p>No students available for enrollment</p>
              ) : (
                <div>
                  <div className="mb-2 flex justify-between items-center">
                    <h3 className="font-medium">Select Students:</h3>
                    <div className="text-sm text-gray-500">
                      {selectedStudents.length} students selected
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center p-3 hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          className="mr-3"
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="flex-1 flex items-center cursor-pointer"
                        >
                          <div>
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                disabled={
                  enrollStudentsMutation.isPending || 
                  selectedStudents.length === 0 || 
                  !selectedBatchId
                }
                onClick={enrollStudents}
              >
                {enrollStudentsMutation.isPending ? "Enrolling..." : "Enroll Selected Students"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}