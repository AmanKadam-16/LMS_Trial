import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { User, Mail, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  // Password is optional for updates
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function StudentProfile() {
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get enrollment data
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/enrollments/user"],
  });
  
  // Get exam attempt data
  const { data: examAttempts = [] } = useQuery<any[]>({
    queryKey: ["/api/exam-attempts/user"],
  });
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      password: "",
    },
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    // Only include password if it's not empty
    const updateData = {...data};
    if (!updateData.password) {
      delete updateData.password;
    }
    
    updateProfileMutation.mutate(updateData, {
      onSuccess: (updatedUser) => {
        setIsEditing(false);
        // Reset form with updated values directly from the response
        form.reset({
          firstName: updatedUser.firstName || "",
          lastName: updatedUser.lastName || "",
          email: updatedUser.email || "",
          password: "",
        });
        
        // Force a re-query of the user data to update all UI components
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    });
  };
  
  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-neutral-lightest flex flex-col md:flex-row">
      <Sidebar />
      
      <div className="flex-1 flex flex-col pt-16 md:pl-64 pb-16">
        <div className="px-6 py-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Profile</h1>
              <p className="text-neutral-dark">Manage your account and view your progress</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-neutral-medium capitalize">{user.role}</p>
                  
                  <div className="w-full mt-6 space-y-4">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-neutral-medium" />
                      <span>Username: <span className="font-semibold">{user.username}</span></span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-neutral-medium" />
                      <span>{user.email}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-4 w-4 mr-2 text-neutral-medium" />
                      <span>Enrolled Courses: <span className="font-semibold">{(enrollments as any[]).length}</span></span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <GraduationCap className="h-4 w-4 mr-2 text-neutral-medium" />
                      <span>Exams Taken: <span className="font-semibold">{(examAttempts as any[]).length}</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Learning Statistics</CardTitle>
                  <CardDescription>Your progress summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Course Completion</span>
                        <span className="font-semibold">0%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Exam Performance</span>
                        <span className="font-semibold">0%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Assignments Completed</span>
                        <span className="font-semibold">0/0</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          {...form.register("firstName")}
                          disabled={!isEditing} 
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          {...form.register("lastName")}
                          disabled={!isEditing} 
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        {...form.register("email")}
                        disabled={!isEditing} 
                      />
                      {form.formState.errors.email && (
                        <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Change Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder={isEditing ? "Leave blank to keep current password" : "••••••••"}
                        {...form.register("password")}
                        disabled={!isEditing} 
                      />
                      {form.formState.errors.password && (
                        <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            className="mr-2"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-sm text-neutral-medium">
                    <p>No recent activity to display</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}