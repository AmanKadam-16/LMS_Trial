import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Edit, 
  CheckCircle, 
  Clock, 
  UserPlus 
} from 'lucide-react';

type ActivityType = 'new-course' | 'exam-results' | 'deadline' | 'new-students';

type ActivityItem = {
  id: string | number;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
};

type RecentActivitiesProps = {
  activities: ActivityItem[];
  className?: string;
};

export default function RecentActivities({ activities, className }: RecentActivitiesProps) {
  // Function to get the appropriate icon and color for each activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'new-course':
        return {
          bg: 'bg-info bg-opacity-10',
          icon: <Edit className="h-5 w-5 text-info" />
        };
      case 'exam-results':
        return {
          bg: 'bg-success bg-opacity-10',
          icon: <CheckCircle className="h-5 w-5 text-success" />
        };
      case 'deadline':
        return {
          bg: 'bg-warning bg-opacity-10',
          icon: <Clock className="h-5 w-5 text-warning" />
        };
      case 'new-students':
        return {
          bg: 'bg-primary bg-opacity-10',
          icon: <UserPlus className="h-5 w-5 text-primary" />
        };
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="font-heading font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const { bg, icon } = getActivityIcon(activity.type);
            const isLast = index === activities.length - 1;
            
            return (
              <div 
                key={activity.id} 
                className={cn(
                  "flex items-start py-3", 
                  !isLast && "border-b border-neutral-light"
                )}
              >
                <div className={cn("p-2 rounded-full mr-4", bg)}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-neutral-medium">{activity.description}</p>
                    </div>
                    <span className="text-xs text-neutral-medium">{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="px-6 pt-0 pb-6">
        <Button 
          variant="link" 
          className="mt-4 text-primary text-sm font-medium hover:underline p-0"
        >
          View All Activities
        </Button>
      </CardFooter>
    </Card>
  );
}
