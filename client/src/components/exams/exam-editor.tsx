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
import { Switch } from '@/components/ui/switch';
import { 
  Edit, 
  Trash, 
  Plus 
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Form schema for exam
const examSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  courseId: z.string().min(1, "Please select a course"),
  acceptingResponses: z.boolean().default(true),
});

type ExamFormValues = z.infer<typeof examSchema>;

// Question type - Updated for text-based assignment questions
type QuestionType = {
  id: number;
  text: string;
  order: number;
};

type ExamEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: { id: number; title: string }[];
  exam?: {
    id: number;
    title?: string;
    description?: string;
    courseId?: number;
    acceptingResponses?: boolean;
  };
};

export default function ExamEditor({ open, onOpenChange, courses, exam }: ExamEditorProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [examData, setExamData] = useState<ExamFormValues | null>(null);
  
  // Fetch the complete exam data when editing
  const { data: fetchedExam, isLoading: isLoadingExam } = useQuery({
    queryKey: [`/api/exams/${exam?.id}`],
    queryFn: async () => {
      if (!exam?.id) return null;
      const response = await apiRequest("GET", `/api/exams/${exam.id}`);
      return await response.json();
    },
    enabled: !!exam?.id && open
  });
  
  // Fetch questions for editing an existing exam
  const { data: examQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: [`/api/exams/${exam?.id}/questions`],
    queryFn: async () => {
      if (!exam?.id) return [];
      const response = await apiRequest("GET", `/api/exams/${exam.id}/questions`);
      return await response.json();
    },
    enabled: !!exam?.id && open
  });
  
  // Update exam data when fetched exam changes
  useEffect(() => {
    if (fetchedExam && exam?.id) {
      setExamData({
        title: fetchedExam.title,
        description: fetchedExam.description,
        courseId: String(fetchedExam.courseId),
        acceptingResponses: fetchedExam.acceptingResponses === true // only true if explicitly set to true
      });
    } else if (!exam?.id) {
      setExamData(null);
    }
  }, [fetchedExam, exam?.id]);
  
  // Update questions when examQuestions data changes
  useEffect(() => {
    if (examQuestions && exam?.id) {
      setQuestions(examQuestions);
    } else if (!exam?.id) {
      setQuestions([]);
    }
  }, [examQuestions, exam?.id]);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      acceptingResponses: true,
    }
  });
  
  // Reset form with fetched exam data when available
  useEffect(() => {
    if (examData) {
      reset(examData);
    } else if (!exam?.id) {
      reset({
        title: "",
        description: "",
        courseId: "",
        acceptingResponses: true,
      });
    }
  }, [examData, exam?.id, reset]);

  const onSubmit = async (data: ExamFormValues) => {
    try {
      // Convert courseId to number
      const payload = {
        ...data,
        courseId: parseInt(data.courseId)
      };

      let examId;
      
      if (exam?.id) {
        // Update existing exam
        await apiRequest("PUT", `/api/exams/${exam.id}`, payload);
        examId = exam.id;
        toast({
          title: "Exam updated",
          description: "The exam has been updated successfully."
        });
      } else {
        // Create new exam
        const response = await apiRequest("POST", "/api/exams", payload);
        const newExam = await response.json();
        examId = newExam.id;
        toast({
          title: "Exam created",
          description: "The exam has been created successfully."
        });
      }
      
      // Save questions
      if (examId) {
        try {
          // Clear existing questions first
          await apiRequest("DELETE", `/api/exams/${examId}/questions`);
          
          // Add all questions
          for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            await apiRequest("POST", `/api/exams/${examId}/questions`, {
              text: question.text,
              order: index,
              examId
            });
          }
        } catch (err) {
          console.error("Error saving questions:", err);
          toast({
            title: "Warning",
            description: "Exam was saved but there was an issue saving the questions.",
            variant: "destructive",
          });
        }
      }
      
      queryClient.invalidateQueries({queryKey: ["/api/exams"]});
      queryClient.invalidateQueries({queryKey: [`/api/exams/${examId}/questions`]});
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving the exam.",
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    const newQuestionId = questions.length > 0 
      ? Math.max(...questions.map(q => q.id)) + 1 
      : 1;
    
    setQuestions([...questions, {
      id: newQuestionId,
      text: "",
      order: questions.length
    }]);
  };

  const updateQuestionText = (questionId: number, text: string) => {
    setQuestions(questions.map(question => 
      question.id === questionId 
        ? { ...question, text } 
        : question
    ));
  };

  // No need for option text and correct option methods since we're using text-based questions

  const removeQuestion = (questionId: number) => {
    setQuestions(questions.filter(question => question.id !== questionId));
  };

  // No longer needed for assignment-style text-based exams

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">
            {exam?.id ? "Edit Assignment Exam" : "Create New Assignment Exam"}
          </DialogTitle>
        </DialogHeader>
        
        {(isLoadingExam || isLoadingQuestions) && exam?.id ? (
          <div className="flex justify-center items-center p-6">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-gray-500">Loading exam data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="title">Exam Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g. Data Structures Mid-Term Exam"
                  {...register("title")}
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="courseId">Associated Course</Label>
                <select
                  id="courseId"
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                  {...register("courseId")}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={String(course.id)}>{course.title}</option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Provide a description for the exam"
                  rows={2}
                  {...register("description")}
                  className="mt-1"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
              

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="acceptingResponses"
                    checked={watch("acceptingResponses") === true}
                    onCheckedChange={(checked) => {
                      setValue("acceptingResponses", checked);
                    }}
                  />
                  <Label htmlFor="acceptingResponses" className="cursor-pointer">
                    Accepting responses (when disabled, students cannot submit answers)
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="border-t border-neutral-light pt-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Exam Questions</h4>
              </div>
              
              {questions.map((question, questionIndex) => (
                <div key={question.id} className="border border-neutral-light rounded-md p-4 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium">Question {questionIndex + 1}</h5>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 text-neutral-medium hover:text-red-500"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                    <Textarea 
                      id={`question-${question.id}`}
                      value={question.text}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-neutral-light rounded-md mt-1"
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    This is a text-based question. Students will provide written answers.
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center text-primary font-medium"
                onClick={addQuestion}
              >
                <Plus className="h-5 w-5 mr-1" />
                Add New Question
              </Button>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {exam?.id ? "Update Exam" : "Save Exam"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
