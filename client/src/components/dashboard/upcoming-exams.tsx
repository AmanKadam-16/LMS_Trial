import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

type Urgency = 'high' | 'medium' | 'low';

type ExamItem = {
  id: string | number;
  title: string;
  subtitle: string;
  urgency: Urgency;
  urgencyLabel: string;
  time: string;
};

type UpcomingExamsProps = {
  exams: ExamItem[];
  className?: string;
  onScheduleExam?: () => void;
  showScheduleButton?: boolean;
};

export default function UpcomingExams({ 
  exams, 
  className, 
  onScheduleExam, 
  showScheduleButton = true 
}: UpcomingExamsProps) {
  // Function to get the appropriate color for each urgency level
  const getUrgencyClasses = (urgency: Urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-error bg-opacity-10 text-error';
      case 'medium':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'low':
        return 'bg-info bg-opacity-10 text-info';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="font-heading font-semibold">Upcoming Exams</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam.id} className="p-3 border border-neutral-light rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-sm text-neutral-medium">{exam.subtitle}</p>
                </div>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded",
                  getUrgencyClasses(exam.urgency)
                )}>
                  {exam.urgencyLabel}
                </span>
              </div>
              <div className="flex items-center mt-3 text-xs text-neutral-medium">
                <Clock className="h-4 w-4 mr-1" />
                <span>{exam.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {showScheduleButton && (
        <CardFooter className="px-6 pt-0 pb-6">
          <Button 
            className="mt-6 w-full py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark"
            onClick={onScheduleExam}
          >
            Schedule New Exam
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
