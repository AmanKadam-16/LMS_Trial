import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type ActivityData = {
  day: string;
  percentage: number;
  isCurrentDay?: boolean;
};

type ActivityChartProps = {
  data: ActivityData[];
  changePercentage: string;
  isPositiveChange: boolean;
  className?: string;
};

export default function ActivityChart({ data, changePercentage, isPositiveChange, className }: ActivityChartProps) {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  return (
    <Card className={className}>
      <CardHeader className="px-6 pt-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <CardTitle className="font-heading font-semibold">Student Activity</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={timeframe === 'weekly' ? 'default' : 'outline'} 
              onClick={() => setTimeframe('weekly')}
              size="sm"
              className="text-sm"
            >
              Weekly
            </Button>
            <Button 
              variant={timeframe === 'monthly' ? 'default' : 'outline'} 
              onClick={() => setTimeframe('monthly')}
              size="sm"
              className="text-sm"
            >
              Monthly
            </Button>
            <Button 
              variant={timeframe === 'yearly' ? 'default' : 'outline'} 
              onClick={() => setTimeframe('yearly')}
              size="sm"
              className="text-sm"
            >
              Yearly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="h-64 flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className={cn(
                  "w-full rounded-t-sm", 
                  item.isCurrentDay ? "bg-primary" : "bg-primary-light bg-opacity-20"
                )} 
                style={{ height: `${item.percentage}%` }}
              ></div>
              <p className="text-xs text-neutral-medium mt-2">{item.day}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-dark">Current Week Engagement</p>
              <p className="text-neutral-medium text-xs">vs. Previous Week</p>
            </div>
            <div>
              <span className={cn(
                "font-medium text-sm",
                isPositiveChange ? "text-success" : "text-error"
              )}>
                {isPositiveChange ? '+' : '-'}{changePercentage}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
