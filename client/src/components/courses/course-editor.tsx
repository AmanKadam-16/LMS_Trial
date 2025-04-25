import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash, 
  Video, 
  FileText, 
  Link as LinkIcon,
  Plus,
  UserIcon,
  Upload
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Form schema for course
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  difficulty: z.string().min(1, "Please select a difficulty level"),
  duration: z.number().min(1, "Duration must be at least 1 week"),
  moduleCount: z.number().optional(),
  lessonCount: z.number().optional(),
  thumbnail: z.string().optional().nullable(),
  instructorId: z.number().optional().nullable(),
  isEnrollmentRequired: z.boolean().default(true),
});

type CourseFormValues = z.infer<typeof courseSchema>;

// Module type
type ModuleType = {
  id: number;
  title: string;
  description?: string;
  isOpen?: boolean;
  lessons?: LessonType[];
};

// Lesson type
type LessonType = {
  id: number;
  title: string;
  content?: string;
  contentType: 'video' | 'text' | 'pdf' | 'quiz';
  duration?: number;
  isRequired?: boolean;
  quizData?: any;
};

type CourseEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    duration: number;
    moduleCount?: number;
    lessonCount?: number;
    thumbnail?: string | null;
    instructorId?: number | null;
    isEnrollmentRequired?: boolean;
  };
};

// Define the quiz question type
type QuizQuestion = {
  id: number;
  text: string;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
};

export default function CourseEditor({ open, onOpenChange, course }: CourseEditorProps) {
  const { toast } = useToast();
  const [modules, setModules] = useState<ModuleType[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingLessonIds, setEditingLessonIds] = useState<{moduleId: number, lessonId: number} | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState<string>("");
  const [editModuleDescription, setEditModuleDescription] = useState<string>("");
  const [editLessonTitle, setEditLessonTitle] = useState<string>("");
  const [editLessonContent, setEditLessonContent] = useState<string>("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingModule, setIsSavingModule] = useState<boolean>(false);
  const [isSavingLesson, setIsSavingLesson] = useState<boolean>(false);
  const [questionOptions, setQuestionOptions] = useState<{id: number, text: string, isCorrect: boolean}[]>([
    { id: 1, text: "", isCorrect: false },
    { id: 2, text: "", isCorrect: false },
    { id: 3, text: "", isCorrect: false },
    { id: 4, text: "", isCorrect: false }
  ]);
  
  // Fetch modules when course changes
  useEffect(() => {
    if (course?.id) {
      const fetchModules = async () => {
        try {
          const modulesResponse = await apiRequest("GET", `/api/courses/${course.id}/modules`);
          const modulesData = await modulesResponse.json();
          console.log("Fetched modules:", modulesData);
          
          // For each module, fetch its lessons
          const modulesWithLessons = await Promise.all(
            modulesData.map(async (module: any) => {
              try {
                const lessonsResponse = await apiRequest("GET", `/api/modules/${module.id}/lessons`);
                const lessonsData = await lessonsResponse.json();
                console.log(`Fetched lessons for module ${module.id}:`, lessonsData);
                
                // Process lessons and parse quiz data
                const processedLessons = lessonsData.map((lesson: any) => {
                  let processedLesson = {
                    id: lesson.id,
                    title: lesson.title,
                    contentType: lesson.contentType || "text",
                    content: lesson.content || "",
                    duration: lesson.duration,
                    isRequired: lesson.isRequired,
                    order: lesson.order
                  };
                  
                  // Handle quiz data
                  if (lesson.contentType === 'quiz' && lesson.quizData) {
                    let quizData;
                    try {
                      // First check if quizData is already an object or needs parsing
                      if (typeof lesson.quizData === 'string') {
                        quizData = JSON.parse(lesson.quizData);
                      } else {
                        quizData = lesson.quizData;
                      }
                      
                      // Ensure questions array exists
                      if (!quizData.questions) {
                        quizData.questions = [];
                      }
                      
                      processedLesson.quizData = quizData;
                    } catch (e) {
                      console.error("Error parsing quiz data:", e);
                      processedLesson.quizData = { questions: [] };
                    }
                  }
                  
                  return processedLesson;
                });
                
                return {
                  ...module,
                  isOpen: true,
                  lessons: processedLessons
                };
              } catch (error) {
                console.error(`Error fetching lessons for module ${module.id}:`, error);
                return {
                  ...module,
                  isOpen: true,
                  lessons: []
                };
              }
            })
          );
          
          setModules(modulesWithLessons);
        } catch (error) {
          console.error("Error fetching modules:", error);
          setModules([]);
          toast({
            title: "Error",
            description: "Failed to load course content. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      fetchModules();
    } else {
      setModules([]);
    }
  }, [course?.id, toast]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      title: "",
      description: "",
      category: "",
      difficulty: "",
      duration: 12,
      moduleCount: 0,
      lessonCount: 0,
      thumbnail: null,
      instructorId: null,
      isEnrollmentRequired: true,
    }
  });
  
  // Reset form values when course changes
  useEffect(() => {
    console.log("Course data in editor:", course);
    if (course) {
      console.log("Resetting form with data:", course);
      reset({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        duration: course.duration,
        moduleCount: course.moduleCount ?? 0,
        lessonCount: course.lessonCount ?? 0,
        thumbnail: course.thumbnail ?? null,
        instructorId: course.instructorId ?? null,
        isEnrollmentRequired: course.isEnrollmentRequired ?? true,
      });
    } else {
      reset({
        title: "",
        description: "",
        category: "",
        difficulty: "",
        duration: 12,
        moduleCount: 0,
        lessonCount: 0,
        thumbnail: null,
        instructorId: null,
        isEnrollmentRequired: true,
      });
    }
  }, [course, reset]);

  const onSubmit = async (data: CourseFormValues) => {
    setIsSubmitting(true);
    try {
      let courseId;
      
      if (course?.id) {
        // Update existing course
        const response = await apiRequest("PUT", `/api/courses/${course.id}`, data);
        const updatedCourse = await response.json();
        courseId = updatedCourse.id;
        
        // Update module count
        if (modules.length > 0) {
          const totalLessons = modules.reduce((sum, module) => 
            sum + (module.lessons?.length || 0), 0);
            
          await apiRequest("PUT", `/api/courses/${courseId}`, {
            moduleCount: modules.length,
            lessonCount: totalLessons
          });
        }
        
        toast({
          title: "Course updated",
          description: "The course has been updated successfully.",
        });
      } else {
        // Create new course
        const response = await apiRequest("POST", "/api/courses", data);
        const newCourse = await response.json();
        courseId = newCourse.id;
        toast({
          title: "Course created",
          description: "The course has been created successfully.",
        });
      }
      
      // Save all modules and lessons
      if (courseId) {
        await saveAllModules(courseId);
      }
      
      queryClient.invalidateQueries({queryKey: ["/api/courses"]});
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: "There was an error saving the course.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Save all modules and their lessons to the server
  const saveAllModules = async (courseId: number) => {
    try {
      // First, fetch existing modules to determine what needs to be updated vs. created
      const modulesResponse = await apiRequest("GET", `/api/courses/${courseId}/modules`);
      const existingModules = await modulesResponse.json();
      
      // Process each module
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        let moduleId;
        
        // Check if this is an existing module or a new one
        const existingModule = existingModules.find((m: any) => m.id === module.id);
        
        if (existingModule) {
          // Update existing module
          const response = await apiRequest("PUT", `/api/modules/${module.id}`, {
            title: module.title,
            description: module.description || null,
            order: i + 1
          });
          const updatedModule = await response.json();
          moduleId = updatedModule.id;
        } else {
          // Create new module
          const response = await apiRequest("POST", `/api/modules`, {
            title: module.title,
            description: module.description || null,
            courseId: courseId,
            order: i + 1
          });
          const newModule = await response.json();
          moduleId = newModule.id;
        }
        
        // Process lessons for this module
        if (moduleId && module.lessons && module.lessons.length > 0) {
          // Fetch existing lessons
          const lessonsResponse = await apiRequest("GET", `/api/modules/${moduleId}/lessons`);
          const existingLessons = await lessonsResponse.json();
          
          for (let j = 0; j < module.lessons.length; j++) {
            const lesson = module.lessons[j];
            
            // Check if lesson already exists
            const existingLesson = existingLessons.find((l: any) => l.id === lesson.id);
            
            // Prepare lesson data based on content type
            let lessonData: any = {
              title: lesson.title,
              contentType: lesson.contentType || 'text',
              moduleId: moduleId,
              order: j + 1,
              isRequired: lesson.isRequired || true,
              duration: lesson.duration || null
            };
            
            // Add appropriate content based on type
            if (lesson.contentType === 'quiz' && lesson.quizData) {
              lessonData.content = JSON.stringify(lesson.quizData) || '';
              lessonData.quizData = lesson.quizData;
            } else {
              lessonData.content = lesson.content || '';
              lessonData.quizData = null;
            }
            
            if (existingLesson) {
              // Update existing lesson
              await apiRequest("PUT", `/api/lessons/${lesson.id}`, lessonData);
            } else {
              // Create new lesson
              await apiRequest("POST", `/api/lessons`, lessonData);
            }
          }
          
          // Delete lessons that are no longer in the editor
          for (const existingLesson of existingLessons) {
            const stillExists = module.lessons.some(l => l.id === existingLesson.id);
            if (!stillExists) {
              await apiRequest("DELETE", `/api/lessons/${existingLesson.id}`);
            }
          }
        }
      }
      
      // Delete modules that are no longer in the editor
      for (const existingModule of existingModules) {
        const stillExists = modules.some(m => m.id === existingModule.id);
        if (!stillExists) {
          await apiRequest("DELETE", `/api/modules/${existingModule.id}`);
        }
      }
      
      toast({
        title: "Course content saved",
        description: "All modules and lessons have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving modules and lessons:", error);
      toast({
        title: "Error",
        description: "There was an error saving the course content.",
        variant: "destructive",
      });
    }
  };

  const toggleModule = (moduleId: number) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { ...module, isOpen: !module.isOpen } 
        : module
    ));
  };

  const addModule = () => {
    const newModuleId = modules.length > 0 
      ? Math.max(...modules.map(m => m.id)) + 1 
      : 1;
    
    setModules([...modules, {
      id: newModuleId,
      title: `Module ${newModuleId}: New Module`,
      isOpen: true,
      lessons: []
    }]);
  };

  const addLesson = (moduleId: number, contentType: 'video' | 'text' | 'pdf' | 'quiz' = 'text') => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const lessons = module.lessons || [];
        const newLessonId = lessons.length > 0 
          ? Math.max(...lessons.map(l => l.id)) + 1 
          : 1;
        
        return {
          ...module,
          lessons: [...lessons, {
            id: newLessonId,
            title: `New ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Lesson`,
            content: '',
            contentType: contentType,
            duration: contentType === 'video' ? 30 : undefined,
            isRequired: true,
            quizData: contentType === 'quiz' ? { questions: [] } : undefined
          }]
        };
      }
      return module;
    }));
  };
  
  // Start editing a module
  const startEditingModule = (moduleId: number) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setEditingModuleId(moduleId);
      setEditModuleTitle(module.title);
      setEditModuleDescription(module.description || '');
    }
  };
  
  // Save module edits
  const saveModuleEdit = () => {
    if (editingModuleId === null) return;
    
    setIsSavingModule(true);
    
    setModules(modules.map(module => 
      module.id === editingModuleId 
        ? { 
            ...module, 
            title: editModuleTitle,
            description: editModuleDescription 
          } 
        : module
    ));
    
    // Reset editing state
    setEditingModuleId(null);
    setEditModuleTitle('');
    setEditModuleDescription('');
    
    toast({
      title: "Module updated",
      description: "Module details have been updated successfully.",
    });
    
    setIsSavingModule(false);
  };
  
  // Cancel module editing
  const cancelModuleEdit = () => {
    setEditingModuleId(null);
    setEditModuleTitle('');
    setEditModuleDescription('');
  };
  
  // Start editing a lesson
  const startEditingLesson = (moduleId: number, lessonId: number) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || !module.lessons) return;
    
    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      setEditingLessonIds({ moduleId, lessonId });
      setEditLessonTitle(lesson.title);
      setEditLessonContent(lesson.content || '');
      
      // If this is a quiz, set up the quiz questions
      if (lesson.contentType === 'quiz' && lesson.quizData && lesson.quizData.questions) {
        setQuizQuestions(lesson.quizData.questions);
      } else {
        // Reset quiz questions for non-quiz lessons
        setQuizQuestions([]);
      }
    }
  };
  
  // Save lesson edits
  const saveLessonEdit = () => {
    if (!editingLessonIds) return;
    
    setIsSavingLesson(true);
    
    setModules(modules.map(module => 
      module.id === editingLessonIds.moduleId 
        ? { 
            ...module, 
            lessons: module.lessons?.map(lesson => {
              if (lesson.id === editingLessonIds.lessonId) {
                // Check if this is a quiz lesson
                if (lesson.contentType === 'quiz') {
                  return {
                    ...lesson,
                    title: editLessonTitle,
                    quizData: {
                      questions: quizQuestions
                    }
                  };
                } else {
                  // For non-quiz lessons
                  return {
                    ...lesson,
                    title: editLessonTitle,
                    content: editLessonContent
                  };
                }
              }
              return lesson;
            })
          } 
        : module
    ));
    
    // Reset editing state
    setEditingLessonIds(null);
    setEditLessonTitle('');
    setEditLessonContent('');
    setQuizQuestions([]);
    setCurrentQuestion('');
    setQuestionOptions([
      { id: 1, text: "", isCorrect: false },
      { id: 2, text: "", isCorrect: false },
      { id: 3, text: "", isCorrect: false },
      { id: 4, text: "", isCorrect: false }
    ]);
    
    toast({
      title: "Lesson updated",
      description: "Lesson details have been updated successfully.",
    });
    
    setIsSavingLesson(false);
  };
  
  // Cancel lesson editing
  const cancelLessonEdit = () => {
    setEditingLessonIds(null);
    setEditLessonTitle('');
    setEditLessonContent('');
    setQuizQuestions([]);
    setCurrentQuestion('');
    setQuestionOptions([
      { id: 1, text: "", isCorrect: false },
      { id: 2, text: "", isCorrect: false },
      { id: 3, text: "", isCorrect: false },
      { id: 4, text: "", isCorrect: false }
    ]);
  };
  
  // Add a new question to the quiz
  const addQuizQuestion = () => {
    if (!currentQuestion.trim()) {
      toast({
        title: "Error",
        description: "Question text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if at least one option is marked as correct
    const hasCorrectOption = questionOptions.some(option => option.isCorrect);
    if (!hasCorrectOption) {
      toast({
        title: "Error",
        description: "You must mark at least one option as correct.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure all options have text
    const emptyOptions = questionOptions.filter(option => !option.text.trim());
    if (emptyOptions.length > 0) {
      toast({
        title: "Error",
        description: "All option fields must be filled.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new question
    const newQuestion: QuizQuestion = {
      id: quizQuestions.length > 0 ? Math.max(...quizQuestions.map(q => q.id)) + 1 : 1,
      text: currentQuestion,
      options: [...questionOptions]
    };
    
    // Add to questions list
    setQuizQuestions([...quizQuestions, newQuestion]);
    
    // Reset form
    setCurrentQuestion('');
    setQuestionOptions([
      { id: 1, text: "", isCorrect: false },
      { id: 2, text: "", isCorrect: false },
      { id: 3, text: "", isCorrect: false },
      { id: 4, text: "", isCorrect: false }
    ]);
    
    toast({
      title: "Question added",
      description: "Question has been added to the quiz.",
    });
  };
  
  // Remove a question from the quiz
  const removeQuizQuestion = (questionId: number) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
  };
  
  // Update option text for the current question being created
  const updateOptionText = (optionId: number, text: string) => {
    setQuestionOptions(
      questionOptions.map(option => 
        option.id === optionId ? { ...option, text } : option
      )
    );
  };
  
  // Toggle whether an option is correct for the current question
  const toggleOptionCorrect = (optionId: number) => {
    setQuestionOptions(
      questionOptions.map(option => 
        option.id === optionId ? { ...option, isCorrect: !option.isCorrect } : option
      )
    );
  };
  
  // Delete a module
  const deleteModule = (moduleId: number) => {
    setModules(modules.filter(module => module.id !== moduleId));
    toast({
      title: "Module deleted",
      description: "Module and its lessons have been deleted.",
    });
  };
  
  // Delete a lesson
  const deleteLesson = (moduleId: number, lessonId: number) => {
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            lessons: module.lessons?.filter(lesson => lesson.id !== lessonId) 
          } 
        : module
    ));
    toast({
      title: "Lesson deleted",
      description: "Lesson has been removed from the module.",
    });
  };

  // Helper function to render appropriate icon for lesson content type
  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-500 mr-2" />;
      case 'text':
        return <FileText className="h-5 w-5 text-green-500 mr-2" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500 mr-2" />;
      case 'quiz':
        return <Edit className="h-5 w-5 text-purple-500 mr-2" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-orange-500 mr-2" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500 mr-2" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">
            {course?.id ? "Edit Course" : "Create New Course"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <Label htmlFor="title">Course Title</Label>
              <Input 
                id="title"
                placeholder="e.g. Advanced Web Development with React"
                {...register("title")}
                className="mt-1"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Course Description (Rich Text)</Label>
              <Textarea 
                id="description"
                placeholder="Provide a detailed description of the course"
                rows={4}
                {...register("description")}
                className="mt-1"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    defaultValue={course?.category || ""}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    defaultValue={course?.difficulty || ""}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.difficulty && (
                <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input 
                id="duration"
                type="number"
                min={1}
                {...register("duration", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="instructorId">Instructor</Label>
              <Controller
                name="instructorId"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Admin User</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="moduleCount">Number of Modules</Label>
              <Input 
                id="moduleCount"
                type="number"
                min={0}
                {...register("moduleCount", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="lessonCount">Total Lessons/Videos</Label>
              <Input 
                id="lessonCount"
                type="number"
                min={0}
                {...register("lessonCount", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>Course Thumbnail / Cover Image</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag & drop your course image here</p>
                <p className="text-xs text-gray-500 mb-4">Recommended size: 800x450 pixels</p>
                <Button type="button" variant="outline" size="sm">
                  Choose File
                </Button>
                {/* Hidden input for file upload */}
                <input 
                  type="file" 
                  id="thumbnail" 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Controller
                  name="isEnrollmentRequired"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isEnrollmentRequired"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isEnrollmentRequired" className="font-normal">
                  Enrollment Required (uncheck for free access)
                </Label>
              </div>
            </div>
          </div>
          
          <div className="border-t border-neutral-light pt-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Course Content</h4>
              <Button type="button" variant="ghost" className="text-primary text-sm" onClick={addModule}>
                <Plus className="h-4 w-4 mr-1" />
                Add Module
              </Button>
            </div>
            
            {modules.map((module) => (
              <div key={module.id} className="mb-4 border border-neutral-light rounded-md overflow-hidden">
                {editingModuleId === module.id ? (
                  <div className="bg-neutral-lightest p-3">
                    <div className="flex flex-col space-y-3">
                      <Input
                        value={editModuleTitle}
                        onChange={(e) => setEditModuleTitle(e.target.value)}
                        placeholder="Module Title"
                        className="w-full"
                      />
                      <Textarea
                        value={editModuleDescription}
                        onChange={(e) => setEditModuleDescription(e.target.value)}
                        placeholder="Module Description (optional)"
                        rows={2}
                        className="w-full"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelModuleEdit}>
                          Cancel
                        </Button>
                        <Button type="button" variant="default" size="sm" onClick={saveModuleEdit} disabled={isSavingModule}>
                          {isSavingModule ? (
                            <>
                              <span className="animate-spin mr-1">⧗</span>
                              Saving...
                            </>
                          ) : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-lightest p-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 mr-2"
                        onClick={() => toggleModule(module.id)}
                      >
                        {module.isOpen ? (
                          <ChevronDown className="h-5 w-5 text-neutral-dark" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-neutral-dark" />
                        )}
                      </Button>
                      <div>
                        <h5 className="font-medium">{module.title}</h5>
                        {module.description && (
                          <p className="text-xs text-gray-500">{module.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 text-neutral-medium"
                        onClick={() => startEditingModule(module.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 text-neutral-medium hover:text-red-500"
                        onClick={() => deleteModule(module.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {module.isOpen && !editingModuleId && (
                  <div className="p-4">
                    <div className="space-y-3">
                      {module.lessons?.map((lesson) => (
                        <div key={lesson.id} className="bg-white border border-neutral-light rounded-md">
                          {editingLessonIds && 
                           editingLessonIds.moduleId === module.id && 
                           editingLessonIds.lessonId === lesson.id ? (
                            <div className="p-3">
                              <div className="flex flex-col space-y-3">
                                <div className="flex items-center">
                                  {getLessonIcon(lesson.contentType)}
                                  <Input
                                    value={editLessonTitle}
                                    onChange={(e) => setEditLessonTitle(e.target.value)}
                                    placeholder="Lesson Title"
                                    className="flex-1"
                                  />
                                </div>
                                
                                {lesson.contentType === 'quiz' ? (
                                  <div className="border rounded-md p-4 bg-gray-50">
                                    <h4 className="font-medium mb-3">Quiz Questions</h4>
                                    
                                    {/* Existing Questions List */}
                                    {quizQuestions.length > 0 && (
                                      <div className="mb-4 space-y-3">
                                        <h5 className="text-sm font-medium">Existing Questions</h5>
                                        {quizQuestions.map(question => (
                                          <div key={question.id} className="bg-white p-3 rounded border">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <p className="font-medium">{question.text}</p>
                                                <ul className="mt-2 space-y-1 text-sm">
                                                  {question.options.map(option => (
                                                    <li 
                                                      key={option.id}
                                                      className={option.isCorrect ? 'text-green-600 font-medium' : ''}
                                                    >
                                                      {option.isCorrect ? '✓ ' : ''}
                                                      {option.text}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                              <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-red-500"
                                                onClick={() => removeQuizQuestion(question.id)}
                                              >
                                                <Trash className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Add New Question Form */}
                                    <div className="border-t pt-4 mt-4">
                                      <h5 className="text-sm font-medium mb-2">Add New Question</h5>
                                      
                                      <div className="space-y-3">
                                        <div>
                                          <Label htmlFor="questionText">Question Text</Label>
                                          <Input
                                            id="questionText"
                                            value={currentQuestion}
                                            onChange={(e) => setCurrentQuestion(e.target.value)}
                                            placeholder="Enter your question"
                                            className="mt-1"
                                          />
                                        </div>
                                        
                                        <div>
                                          <Label className="mb-2 block">Answer Options</Label>
                                          {questionOptions.map((option) => (
                                            <div key={option.id} className="flex items-center space-x-2 mb-2">
                                              <Checkbox
                                                id={`option-${option.id}`}
                                                checked={option.isCorrect}
                                                onCheckedChange={() => toggleOptionCorrect(option.id)}
                                              />
                                              <Input
                                                value={option.text}
                                                onChange={(e) => updateOptionText(option.id, e.target.value)}
                                                placeholder={`Option ${option.id}`}
                                                className="flex-1"
                                              />
                                            </div>
                                          ))}
                                          <p className="text-xs text-gray-500 mt-1">
                                            Check the box next to correct answer(s).
                                          </p>
                                        </div>
                                        
                                        <Button 
                                          type="button" 
                                          onClick={addQuizQuestion}
                                          variant="outline" 
                                          size="sm"
                                          className="mt-2"
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Add Question
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <Textarea
                                    value={editLessonContent}
                                    onChange={(e) => setEditLessonContent(e.target.value)}
                                    placeholder="Lesson content"
                                    rows={4}
                                    className="w-full"
                                  />
                                )}
                                
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" size="sm" onClick={cancelLessonEdit}>
                                    Cancel
                                  </Button>
                                  <Button type="button" variant="default" size="sm" onClick={saveLessonEdit} disabled={isSavingLesson}>
                                    {isSavingLesson ? (
                                      <>
                                        <span className="animate-spin mr-1">⧗</span>
                                        Saving...
                                      </>
                                    ) : "Save"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-2">
                              <div className="flex items-center">
                                {getLessonIcon(lesson.contentType)}
                                <span>{lesson.title}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1 text-neutral-medium"
                                  onClick={() => startEditingLesson(module.id, lesson.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1 text-neutral-medium hover:text-red-500"
                                  onClick={() => deleteLesson(module.id, lesson.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-primary text-sm" 
                        onClick={() => addLesson(module.id, 'text')}
                      >
                        <FileText className="h-4 w-4 mr-1 text-green-500" />
                        Add Text
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-primary text-sm" 
                        onClick={() => addLesson(module.id, 'video')}
                      >
                        <Video className="h-4 w-4 mr-1 text-blue-500" />
                        Add Video
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-primary text-sm" 
                        onClick={() => addLesson(module.id, 'pdf')}
                      >
                        <FileText className="h-4 w-4 mr-1 text-red-500" />
                        Add PDF
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-primary text-sm" 
                        onClick={() => addLesson(module.id, 'quiz')}
                      >
                        <Edit className="h-4 w-4 mr-1 text-purple-500" />
                        Add Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⧗</span>
                  {course?.id ? "Updating..." : "Saving..."}
                </>
              ) : (
                course?.id ? "Update Course" : "Save Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
