import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, FileText, Clock, User, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';

type ExamAttempt = {
  id: number;
  userId: number;
  examId: number;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string>;
  feedback: string | null;
  reviewedAt: string | null;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  exam: {
    id: number;
    title: string;
    description: string;
  };
};

type Question = {
  id: number;
  text: string;
  order: number;
  examId: number;
};

export default function GradingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch all completed exam attempts
  const { data: examAttempts, isLoading } = useQuery({
    queryKey: ['/api/admin/exam-attempts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/exam-attempts');
      return await response.json();
    },
  });

  // Fetch questions for the selected exam
  const { data: questions } = useQuery({
    queryKey: [`/api/exams/${selectedAttempt?.examId}/questions`],
    queryFn: async () => {
      if (!selectedAttempt?.examId) return [];
      const response = await apiRequest('GET', `/api/exams/${selectedAttempt.examId}/questions`);
      return await response.json();
    },
    enabled: !!selectedAttempt?.examId,
  });

  const filteredAttempts = examAttempts?.filter((attempt: ExamAttempt) =>
    attempt.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleGrade = async () => {
    if (!selectedAttempt) return;

    setIsSubmitting(true);
    try {
      await apiRequest('PUT', `/api/admin/exam-attempts/${selectedAttempt.id}/grade`, {
        feedback,
      });

      toast({
        title: 'Grading completed',
        description: 'The exam has been graded successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/exam-attempts'] });
      setIsGradingOpen(false);
      setSelectedAttempt(null);
      setFeedback('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save grading. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGrading = (attempt: ExamAttempt) => {
    setSelectedAttempt(attempt);
    setFeedback(attempt.feedback || '');
    setIsGradingOpen(true);
  };

  const getStatusBadge = (attempt: ExamAttempt) => {
    if (!attempt.completedAt) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    
    if (attempt.reviewedAt) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Graded
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <FileText className="h-3 w-3 mr-1" />
        Needs Grading
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading exam submissions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Exam Grading</h1>
        <p className="text-gray-600">Review and grade student exam submissions</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by student name or exam title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Exam Attempts List */}
      <div className="grid gap-4">
        {filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No submissions match your search.' : 'No exam submissions available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAttempts.map((attempt: ExamAttempt) => (
            <Card key={attempt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-lg">{attempt.exam.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {attempt.user.firstName} {attempt.user.lastName} ({attempt.user.username})
                          </div>
                          {attempt.completedAt && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Submitted {new Date(attempt.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(attempt)}
                    {attempt.completedAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGrading(attempt)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {attempt.reviewedAt ? 'View Grading' : 'Grade'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Grade Exam: {selectedAttempt?.exam.title}
            </DialogTitle>
            <div className="text-sm text-gray-500">
              Student: {selectedAttempt?.user.firstName} {selectedAttempt?.user.lastName} ({selectedAttempt?.user.username})
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Student Answers */}
            <div>
              <h3 className="text-lg font-medium mb-4">Student Answers</h3>
              <div className="space-y-4">
                {questions?.map((question: Question, index: number) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Question {index + 1}</h4>
                    <p className="text-gray-700 mb-3">{question.text}</p>
                    <div className="bg-gray-50 rounded p-3">
                      <Label className="text-sm font-medium text-gray-600">Student Answer:</Label>
                      <p className="mt-1 text-gray-900">
                        {selectedAttempt?.answers?.[question.id] || 'No answer provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Section */}
            <div>
              <Label htmlFor="feedback" className="text-lg font-medium">
                Instructor Feedback
              </Label>
              <Textarea
                id="feedback"
                placeholder="Provide detailed feedback on the student's performance..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Grading'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}