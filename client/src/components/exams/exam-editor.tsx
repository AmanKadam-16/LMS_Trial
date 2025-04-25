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
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  maxAttempts: z.number().min(1, "Maximum attempts must be at least 1"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;

// Question type
type QuestionType = {
  id: number;
  text: string;
  options: string[];
  correctOption: number;
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
    duration?: number;
    maxAttempts?: number;
    startTime?: string;
    endTime?: string;
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
      // Format datetime values for HTML datetime-local input
      const formatDateTimeForInput = (dateTimeStr: string | undefined) => {
        if (!dateTimeStr) return "";
        try {
          const date = new Date(dateTimeStr);
          // Format as YYYY-MM-DDThh:mm
          return date.toISOString().slice(0, 16);
        } catch (e) {
          console.error("Failed to parse date:", e);
          return "";
        }
      };
      
      setExamData({
        title: fetchedExam.title,
        description: fetchedExam.description,
        courseId: String(fetchedExam.courseId),
        duration: fetchedExam.duration,
        maxAttempts: fetchedExam.maxAttempts,
        startTime: formatDateTimeForInput(fetchedExam.startTime),
        endTime: formatDateTimeForInput(fetchedExam.endTime)
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

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      duration: 60,
      maxAttempts: 1,
      startTime: "",
      endTime: "",
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
        duration: 60,
        maxAttempts: 1,
        startTime: "",
        endTime: "",
      });
    }
  }, [examData, exam?.id, reset]);

  const onSubmit = async (data: ExamFormValues) => {
    try {
      // Convert courseId to number and make sure dates are properly formatted
      const payload = {
        ...data,
        courseId: parseInt(data.courseId),
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined
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
          for (const [index, question] of questions.entries()) {
            await apiRequest("POST", `/api/exams/${examId}/questions`, {
              text: question.text,
              options: question.options,
              correctOption: question.correctOption,
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
      options: ["", "", "", ""],
      correctOption: 0
    }]);
  };

  const updateQuestionText = (questionId: number, text: string) => {
    setQuestions(questions.map(question => 
      question.id === questionId 
        ? { ...question, text } 
        : question
    ));
  };

  const updateOptionText = (questionId: number, optionIndex: number, text: string) => {
    setQuestions(questions.map(question => {
      if (question.id === questionId) {
        const newOptions = [...question.options];
        newOptions[optionIndex] = text;
        return { ...question, options: newOptions };
      }
      return question;
    }));
  };

  const updateCorrectOption = (questionId: number, optionIndex: number) => {
    setQuestions(questions.map(question => 
      question.id === questionId 
        ? { ...question, correctOption: optionIndex } 
        : question
    ));
  };

  const removeQuestion = (questionId: number) => {
    setQuestions(questions.filter(question => question.id !== questionId));
  };

  const addOption = (questionId: number) => {
    setQuestions(questions.map(question => {
      if (question.id === questionId) {
        return { ...question, options: [...question.options, ""] };
      }
      return question;
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold">
            {exam?.id ? "Edit MCQ Exam" : "Create New MCQ Exam"}
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
                <Select 
                  value={examData?.courseId || ""}
                  onValueChange={(value) => {
                    const event = { target: { value, name: "courseId" } };
                    // @ts-ignore
                    register("courseId").onChange(event);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
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
                <Label htmlFor="maxAttempts">Maximum Attempts</Label>
                <Input 
                  id="maxAttempts"
                  type="number"
                  min={1}
                  {...register("maxAttempts", { valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.maxAttempts && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxAttempts.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="startTime">Start Date & Time</Label>
                <Input 
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="endTime">End Date & Time</Label>
                <Input 
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                  className="mt-1"
                />
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
                  
                  <div className="space-y-2 mb-3">
                    <RadioGroup 
                      defaultValue={String(question.correctOption)} 
                      onValueChange={(value) => updateCorrectOption(question.id, parseInt(value))}
                    >
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center">
                          <RadioGroupItem 
                            value={String(optionIndex)} 
                            id={`q${question.id}_opt${optionIndex}`} 
                            className="mr-2"
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateOptionText(question.id, optionIndex, e.target.value)}
                            className="flex-1 p-2 border border-neutral-light rounded-md"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="text-primary text-sm hover:underline p-0"
                    onClick={() => addOption(question.id)}
                  >
                    + Add Option
                  </Button>
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
