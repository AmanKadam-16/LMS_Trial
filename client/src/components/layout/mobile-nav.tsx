import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Users, 
  User,
  BookOpenCheck,
  CalendarClock,
  PieChart,
  Bot
} from 'lucide-react';

type MobileNavLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const MobileNavLink = ({ href, icon, label, isActive }: MobileNavLinkProps) => {
  return (
    <Link href={href}>
      <a className={`flex flex-col items-center p-2 ${isActive ? 'text-primary' : 'text-neutral-medium'}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </a>
    </Link>
  );
};

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!user || !isMobile) return null;

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  if (isAdmin) {
    return (
      <div className="mobile-nav fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-neutral-light z-10">
        <div className="flex justify-around p-2">
          <MobileNavLink 
            href="/admin/dashboard" 
            icon={<LayoutDashboard className="h-6 w-6" />} 
            label="Dashboard"
            isActive={location === "/admin/dashboard" || location === "/"}
          />
          <MobileNavLink 
            href="/admin/courses" 
            icon={<BookOpen className="h-6 w-6" />} 
            label="Courses"
            isActive={location === "/admin/courses"}
          />
          <MobileNavLink 
            href="/admin/exams" 
            icon={<ClipboardList className="h-6 w-6" />} 
            label="Exams"
            isActive={location === "/admin/exams"}
          />

          <MobileNavLink 
            href="/admin/profile" 
            icon={<User className="h-6 w-6" />} 
            label="Profile"
            isActive={location === "/admin/profile"}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mobile-nav fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-neutral-light z-10">
      <div className="flex justify-around p-2">
        <MobileNavLink 
          href="/student/dashboard" 
          icon={<LayoutDashboard className="h-6 w-6" />} 
          label="Dashboard"
          isActive={location === "/student/dashboard" || location === "/"}
        />
        <MobileNavLink 
          href="/student/my-courses" 
          icon={<BookOpenCheck className="h-6 w-6" />} 
          label="Courses"
          isActive={location === "/student/my-courses"}
        />
        <MobileNavLink 
          href="/student/ai-assistant" 
          icon={<Bot className="h-6 w-6" />} 
          label="AI Help"
          isActive={location === "/student/ai-assistant"}
        />

        <MobileNavLink 
          href="/student/profile" 
          icon={<User className="h-6 w-6" />} 
          label="Profile"
          isActive={location === "/student/profile"}
        />
      </div>
    </div>
  );
}
