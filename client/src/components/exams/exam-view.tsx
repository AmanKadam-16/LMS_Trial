import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ExamQuestion = {
  id: number;
  text: string;
  options: string[];
  order: number;
};

type ExamViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: {
    id: number;
    title: string;
    description: string;
    duration: number;
  };
};

export default function ExamView({ open, onOpenChange, exam }: ExamViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examAttemptId, setExamAttemptId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isTimeWarningOpen, setIsTimeWarningOpen] = useState(false);
  const { toast } = useToast();

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load exam questions and start the exam
  useEffect(() => {
    if (open && exam) {
      const fetchQuestions = async () => {
        try {
          // First, create an exam attempt
          const attemptResponse = await apiRequest('POST', '/api/exam-attempts', { examId: exam.id });
          const attemptData = await attemptResponse.json();
          setExamAttemptId(attemptData.id);

          // Then, fetch questions
          const questionsResponse = await apiRequest('GET', `/api/exams/${exam.id}/questions`);
          const questionsData = await questionsResponse.json();
          
          // Sort by order property
          const sortedQuestions = questionsData.sort((a: any, b: any) => a.order - b.order);
          setQuestions(sortedQuestions);
          
          // Initialize answers object with empty values
          const initialAnswers: Record<number, number> = {};
          sortedQuestions.forEach((q: ExamQuestion) => {
            initialAnswers[q.id] = -1; // -1 means no answer selected
          });
          setAnswers(initialAnswers);
          
          // Set timer
          setTimeRemaining(exam.duration * 60);
          
          setIsLoading(false);
        } catch (error) {
          toast({
            title: 'Error loading exam',
            description: 'There was an error starting the exam. Please try again.',
            variant: 'destructive',
          });
          onOpenChange(false);
        }
      };

      fetchQuestions();
    }

    // Cleanup function to handle exam cancellation
    return () => {
      if (examAttemptId && !isSubmitting) {
        // Maybe log that the exam was canceled
        console.log('Exam was closed without submitting');
      }
    };
  }, [open, exam, toast, onOpenChange]);

  // Timer countdown
  useEffect(() => {
    if (!open || !exam || isLoading || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        // Show warning when 5 minutes remain
        if (prev === 300) {
          setIsTimeWarningOpen(true);
        }
        
        // Auto-submit when time is up
        if (prev <= 1) {
          handleSubmitExam();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, exam, isLoading, timeRemaining]);

  // Handle answer selection
  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Mark question for review (this would typically add to a "reviewLater" array)
  const handleMarkForReview = () => {
    toast({
      title: 'Marked for review',
      description: 'This question has been marked for review.',
    });
  };

  // Clear selected answer
  const handleClearSelection = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: -1,
      }));
    }
  };

  // Submit exam
  const handleSubmitExam = async () => {
    if (!examAttemptId || !exam) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit answers
      await apiRequest('PUT', `/api/exam-attempts/${examAttemptId}`, {
        completedAt: new Date().toISOString(),
        answers,
      });
      
      // Close the exam dialog
      onOpenChange(false);
      
      // Show success message
      toast({
        title: 'Exam submitted',
        description: 'Your exam has been submitted successfully.',
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({queryKey: ['/api/exam-attempts/user']});
      
    } catch (error) {
      toast({
        title: 'Error submitting exam',
        description: 'There was an error submitting your exam. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
    }
  };

  // Check if all questions have been answered
  const allQuestionsAnswered = () => {
    return Object.values(answers).every((answer) => answer !== -1);
  };

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Dialog open={open} onOpenChange={(value) => {
        if (!value && !isSubmitting) {
          // Confirm before closing if not submitting
          setIsSubmitDialogOpen(true);
          return;
        }
        onOpenChange(value);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle className="font-heading font-semibold">{exam?.title}</DialogTitle>
                  <div className="bg-warning bg-opacity-10 text-warning font-medium px-4 py-2 rounded-lg flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Time Remaining: {formatTime(timeRemaining)}
                  </div>
                </div>
                <p className="text-neutral-medium text-sm">{exam?.description}</p>
              </DialogHeader>
              
              <div className="flex mb-6 border-b border-neutral-light overflow-x-auto">
                <Tabs defaultValue={String(currentQuestionIndex)} className="w-full">
                  <TabsList className="w-full justify-start">
                    {questions.map((q, index) => (
                      <TabsTrigger 
                        key={q.id} 
                        value={String(index)}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`px-4 py-2 ${index === currentQuestionIndex ? 'text-primary border-b-2 border-primary font-medium' : 'text-neutral-medium hover:text-neutral-dark'}`}
                      >
                        Question {index + 1}
                        {answers[q.id] !== -1 && (
                          <Badge className="ml-2 bg-green-100 text-green-800 h-2 w-2 p-0 rounded-full" />
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              {currentQuestion && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-4">{currentQuestion.text}</h4>
                  
                  <RadioGroup 
                    value={String(answers[currentQuestion.id])} 
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <Card key={index} className={`hover:bg-neutral-lightest ${answers[currentQuestion.id] === index ? 'border-primary' : ''}`}>
                        <CardContent className="p-0">
                          <Label
                            htmlFor={`q${currentQuestion.id}_option${index}`}
                            className="flex items-center p-3 w-full cursor-pointer"
                          >
                            <RadioGroupItem 
                              value={String(index)} 
                              id={`q${currentQuestion.id}_option${index}`}
                              className="mr-3" 
                            />
                            <span>{option}</span>
                          </Label>
                        </CardContent>
                      </Card>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              <DialogFooter className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleMarkForReview}>
                    Mark for Review
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleClearSelection}
                    disabled={answers[currentQuestion?.id] === -1}
                    className="text-warning border-warning hover:bg-warning hover:text-white"
                  >
                    Clear Selection
                  </Button>
                </div>
                
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={handleNextQuestion}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsSubmitDialogOpen(true)}
                    className="bg-primary text-white"
                  >
                    Submit Exam
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirm submission dialog */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit the exam?</AlertDialogTitle>
            <AlertDialogDescription>
              {!allQuestionsAnswered() && (
                <div className="flex items-center text-amber-500 mb-2">
                  <AlertTriangle className="h-5 w-5 mr-1" />
                  <span>You have unanswered questions!</span>
                </div>
              )}
              Once submitted, you won't be able to change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmitExam}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Time warning dialog */}
      <AlertDialog open={isTimeWarningOpen} onOpenChange={setIsTimeWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-500 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Time is running out!
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have 5 minutes remaining to complete the exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
