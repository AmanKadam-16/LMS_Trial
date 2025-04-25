import { Bell, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import SidebarToggle from './sidebar-toggle';

type HeaderProps = {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="mb-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <SidebarToggle />
          <div>
            <h1 className="text-2xl font-heading font-semibold">{title}</h1>
            <p className="text-neutral-medium">
              {subtitle || `Welcome back, ${user?.firstName}. Here's what's happening today.`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 bg-white rounded-full shadow-sm">
            <Bell className="h-6 w-6 text-neutral-medium" />
          </button>
          <button className="p-2 bg-white rounded-full shadow-sm">
            <Settings className="h-6 w-6 text-neutral-medium" />
          </button>
        </div>
      </div>
    </header>
  );
}
