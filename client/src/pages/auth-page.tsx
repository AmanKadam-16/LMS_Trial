import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Password validation regex (at least 8 chars, one uppercase, one lowercase, one number, one special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Registration form schema
const registerSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  gender: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  profilePhoto: z.instanceof(File).optional(),
  
  // Academic Details
  educationLevel: z.string({
    required_error: "Education level is required",
  }),
  schoolCollege: z.string().min(1, "School/College name is required"),
  yearOfStudy: z.string({
    required_error: "Year of study is required",
  }),
  
  // Login Credentials
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().refine(
    (val) => passwordRegex.test(val),
    "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
  ),
  confirmPassword: z.string(),
  tenantId: z.number().min(1, "Tenant ID is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin" || user.role === "superadmin") {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/student/dashboard");
      }
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      gender: "Prefer not to say",
      dateOfBirth: undefined,
      educationLevel: "",
      schoolCollege: "",
      yearOfStudy: "",
      tenantId: 1, // Default to first tenant
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert("Only JPG, JPEG and PNG files are allowed");
        return;
      }
      
      // Validate file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size should not exceed 2MB");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Format date of birth as YYYY-MM-DD string
    let dateOfBirthStr = '';
    if (data.dateOfBirth instanceof Date) {
      dateOfBirthStr = data.dateOfBirth.toISOString().split('T')[0];
    }
    
    // Extract values we need from the form data (remove confirmPassword as it's not in our schema)
    const { confirmPassword, profilePhoto, ...validFormData } = data;
    
    // Prepare the registration data for submission
    const registrationData = {
      ...validFormData,
      dateOfBirth: dateOfBirthStr,
      profilePhoto: selectedFile, // Pass the actual File object if exists
      confirmPassword: confirmPassword, // Include for validation
      role: "student" // Default role for new registrations
    };
    
    // Call the registration mutation with the data including the file if selected
    registerMutation.mutate(registrationData as any);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary p-3 rounded-md">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading font-semibold">Edu Transform Platform</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to access courses and exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="bg-primary/10 p-3 rounded-md mb-4 text-sm">
                    <p className="font-medium">👋 Welcome to Edu Transform</p>
                    <p className="text-sm text-muted-foreground">
                      Students and administrators use the same login form.
                      Your role-based permissions will determine what you can access.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input 
                      id="login-username" 
                      type="text" 
                      placeholder="Enter your username"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-sm">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <h3 className="text-lg font-medium border-b pb-2">1. Personal Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-first-name">First Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="register-first-name" 
                        type="text" 
                        placeholder="Enter your first name"
                        {...registerForm.register("firstName")}
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-last-name">Last Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="register-last-name" 
                        type="text" 
                        placeholder="Enter your last name"
                        {...registerForm.register("lastName")}
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address <span className="text-red-500">*</span></Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="Enter your email address"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-mobile">Mobile Number <span className="text-red-500">*</span></Label>
                    <Input 
                      id="register-mobile" 
                      type="tel" 
                      placeholder="Enter your mobile number"
                      {...registerForm.register("mobileNumber")}
                    />
                    {registerForm.formState.errors.mobileNumber && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.mobileNumber.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-gender">Gender</Label>
                    <Controller
                      name="gender"
                      control={registerForm.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-dob">Date of Birth <span className="text-red-500">*</span></Label>
                    <Controller
                      name="dateOfBirth"
                      control={registerForm.control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          id="register-dob"
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            field.onChange(e.target.value ? new Date(e.target.value) : undefined);
                          }}
                        />
                      )}
                    />
                    {registerForm.formState.errors.dateOfBirth && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.dateOfBirth.message as string}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-profile-photo">Profile Photo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="register-profile-photo"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select Photo
                      </Button>
                      {selectedFile && <span className="text-sm">{selectedFile.name}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Optional. Maximum size: 2MB. Formats: JPG, JPEG, PNG</p>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 border-b pb-2">2. Academic Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-education">Education Level <span className="text-red-500">*</span></Label>
                    <Controller
                      name="educationLevel"
                      control={registerForm.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your education level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10th">10th</SelectItem>
                            <SelectItem value="12th">12th</SelectItem>
                            <SelectItem value="Diploma">Diploma</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                            <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {registerForm.formState.errors.educationLevel && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.educationLevel.message as string}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-school">School/College Name <span className="text-red-500">*</span></Label>
                    <Input 
                      id="register-school" 
                      type="text" 
                      placeholder="Enter your school or college name"
                      {...registerForm.register("schoolCollege")}
                    />
                    {registerForm.formState.errors.schoolCollege && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.schoolCollege.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-year">Year of Study <span className="text-red-500">*</span></Label>
                    <Controller
                      name="yearOfStudy"
                      control={registerForm.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your year of study" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st Year">1st Year</SelectItem>
                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                            <SelectItem value="4th Year">4th Year</SelectItem>
                            <SelectItem value="Final Year">Final Year</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {registerForm.formState.errors.yearOfStudy && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.yearOfStudy.message as string}</p>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 border-b pb-2">3. Login Credentials</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username <span className="text-red-500">*</span></Label>
                    <Input 
                      id="register-username" 
                      type="text" 
                      placeholder="Choose a username"
                      {...registerForm.register("username")}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password <span className="text-red-500">*</span></Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="Choose a password"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long and include uppercase, lowercase, 
                      number, and special character.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password <span className="text-red-500">*</span></Label>
                    <Input 
                      id="register-confirm-password" 
                      type="password" 
                      placeholder="Confirm your password"
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-red-500 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  {/* Hidden tenant ID field - using default tenant */}
                  <input 
                    type="hidden" 
                    {...registerForm.register("tenantId", { valueAsNumber: true })}
                    value={1}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="w-full md:w-1/2 bg-primary text-white p-8 flex items-center justify-center">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-heading font-bold mb-6">Welcome to Edu Transform</h1>
          <p className="text-lg mb-6">
            The complete Learning Management System for educational institutions and organizations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Manage Courses</h3>
              <p className="text-sm text-white/80">Create and organize courses with lessons in various formats.</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Create Exams</h3>
              <p className="text-sm text-white/80">Configure MCQ exams with timing, attempts and question banks.</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-white/80">Monitor student performance with detailed analytics.</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Multi-tenant</h3>
              <p className="text-sm text-white/80">Isolated environments for each organization or institution.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
