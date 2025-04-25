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
import DashboardLayout from "@/components/layout/dashboard-layout";
import { User, KeyRound, Mail, Building, AtSign, Loader2 } from "lucide-react";

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  // Password is optional for updates
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfile() {
  const { user, updateProfileMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
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
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-neutral-dark">Manage your account information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Details about your account</CardDescription>
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
                  <Building className="h-4 w-4 mr-2 text-neutral-medium" />
                  <span>Tenant ID: <span className="font-semibold">{user.tenantId}</span></span>
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
        </div>
      </div>
    </DashboardLayout>
  );
}