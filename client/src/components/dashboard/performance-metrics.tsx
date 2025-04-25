import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CoursePerformanceData = {
  name: string;
  percentage: number;
};

type PerformanceMetricsProps = {
  courses: CoursePerformanceData[];
  className?: string;
};

export default function PerformanceMetrics({ courses, className }: PerformanceMetricsProps) {
  // Helper function to determine color based on percentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <Card className={className}>
      <CardHeader className="px-6 pt-6 pb-0">
        <CardTitle className="font-heading font-semibold mb-6">Course Performance</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{course.name}</span>
                <span>{course.percentage}%</span>
              </div>
              <div className="w-full bg-neutral-light rounded-full h-2">
                <div 
                  className={cn("rounded-full h-2", getColorClass(course.percentage))} 
                  style={{ width: `${course.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-6 pt-0 pb-6">
        <Button 
          variant="outline" 
          className="w-full py-2 text-primary text-sm font-medium rounded-md"
        >
          View Detailed Report
        </Button>
      </CardFooter>
    </Card>
  );
}
