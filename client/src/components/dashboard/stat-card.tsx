import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconColor: 'primary' | 'accent' | 'secondary';
};

export default function StatCard({ title, value, change, icon, iconColor }: StatCardProps) {
  const iconBackgroundColors = {
    primary: 'bg-primary/10',
    accent: 'bg-blue-100',
    secondary: 'bg-emerald-100'
  };

  const iconTextColors = {
    primary: 'text-primary',
    accent: 'text-blue-600',
    secondary: 'text-emerald-600'
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-neutral-medium text-sm">{title}</p>
            <h3 className="text-2xl font-semibold mt-1">{value}</h3>
            {change && (
              <p className="text-xs mt-1">
                <span className={cn("font-medium", change.positive ? "text-success" : "text-error")}>
                  {change.positive ? '↑' : '↓'} {change.value}
                </span>
                <span className="text-neutral-medium ml-1">from last month</span>
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-full flex items-center justify-center", iconBackgroundColors[iconColor])}>
            <div className={cn("h-6 w-6", iconTextColors[iconColor])}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
