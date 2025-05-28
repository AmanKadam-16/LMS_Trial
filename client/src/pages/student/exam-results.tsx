import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, FileText, Clock, Eye, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ExamResult = {
  id: number;
  userId: number;
  examId: number;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string>;
  feedback: string | null;
  reviewedAt: string | null;
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

export default function ExamResultsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch student's exam results
  const { data: examResults, isLoading } = useQuery({
    queryKey: ['/api/student/exam-results'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/student/exam-results');
      return await response.json();
    },
  });

  // Fetch questions for the selected exam
  const { data: questions } = useQuery({
    queryKey: [`/api/exams/${selectedResult?.examId}/questions`],
    queryFn: async () => {
      if (!selectedResult?.examId) return [];
      const response = await apiRequest('GET', `/api/exams/${selectedResult.examId}/questions`);
      return await response.json();
    },
    enabled: !!selectedResult?.examId,
  });

  const filteredResults = examResults?.filter((result: ExamResult) =>
    result.exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openDetail = (result: ExamResult) => {
    setSelectedResult(result);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (result: ExamResult) => {
    if (!result.completedAt) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    
    if (result.reviewedAt && result.feedback) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Graded
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending Review
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500">Loading your exam results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My Exam Results</h1>
        <p className="text-gray-600">View your completed exams and instructor feedback</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search exam results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="grid gap-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exam results found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No results match your search.' : 'You haven\'t completed any exams yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((result: ExamResult) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-lg">{result.exam.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{result.exam.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                          {result.completedAt && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Submitted {new Date(result.completedAt).toLocaleDateString()}
                            </div>
                          )}
                          {result.reviewedAt && (
                            <div className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Reviewed {new Date(result.reviewedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(result)}
                    {result.completedAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(result)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Exam Results: {selectedResult?.exam.title}
            </DialogTitle>
            <div className="text-sm text-gray-500">
              Submitted on {selectedResult?.completedAt ? 
                new Date(selectedResult.completedAt).toLocaleDateString() : 'Not completed'
              }
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Questions and Answers */}
            <div>
              <h3 className="text-lg font-medium mb-4">Your Answers</h3>
              <div className="space-y-4">
                {questions?.map((question: Question, index: number) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Question {index + 1}</h4>
                    <p className="text-gray-700 mb-3">{question.text}</p>
                    <div className="bg-blue-50 rounded p-3">
                      <Label className="text-sm font-medium text-blue-600">Your Answer:</Label>
                      <p className="mt-1 text-gray-900">
                        {selectedResult?.answers?.[question.id] || 'No answer provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Feedback */}
            {selectedResult?.feedback && (
              <div>
                <h3 className="text-lg font-medium mb-3">Instructor Feedback</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedResult.feedback}</p>
                  {selectedResult.reviewedAt && (
                    <div className="mt-3 text-sm text-green-600">
                      Reviewed on {new Date(selectedResult.reviewedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No feedback yet */}
            {selectedResult?.completedAt && !selectedResult?.feedback && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800">
                    Your exam is being reviewed. Feedback will be available soon.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}