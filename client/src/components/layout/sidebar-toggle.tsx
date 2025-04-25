import { Menu, ChevronLeft } from 'lucide-react';
import { useSidebar } from '@/hooks/use-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

export default function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Don't render toggle if user is not logged in or if on mobile
  if (!user || isMobile) return null;

  return (
    <button
      onClick={toggleSidebar}
      className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-neutral-medium hover:text-primary transition-colors"
      aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
    >
      {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
}