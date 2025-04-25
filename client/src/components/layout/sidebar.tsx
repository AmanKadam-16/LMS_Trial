import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/hooks/use-sidebar";
import {
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  BookOpenCheck,
  CalendarClock,
  PieChart,
  LogOut,
  User as UserIcon,
  Building,
  ChevronLeft,
  Menu,
  Bot,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
};

const SidebarLink = ({ href, icon, children, isActive }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-6 py-3 text-neutral-dark hover:bg-neutral-lightest transition-colors",
          isActive &&
            "text-primary bg-neutral-lightest border-l-3 border-primary",
        )}
      >
        <span className="mr-3">{icon}</span>
        {children}
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar } = useSidebar();

  // Don't render sidebar if user is not logged in or if on mobile view
  if (!user || isMobile) return null;

  // Don't render if sidebar is closed in desktop mode
  if (!sidebarOpen) return null;

  const isAdmin = user.role === "admin" || user.role === "superadmin";

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const isLoggingOut = logoutMutation.isPending;

  return (
    <div className="sidebar fixed w-64 h-full bg-white shadow-md z-10">
      <div className="p-4 border-b border-neutral-light">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-md">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-semibold">
              Edu Transform
            </h1>
            <p className="text-xs text-neutral-medium">
              {/* This would come from the tenant information */}
              Aadi Technology
            </p>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="py-4">
          <p className="px-6 py-1 text-xs font-semibold text-neutral-medium uppercase">
            Management
          </p>
          <SidebarLink
            href="/admin/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            isActive={location === "/admin/dashboard" || location === "/"}
          >
            Dashboard
          </SidebarLink>
          <SidebarLink
            href="/admin/courses"
            icon={<BookOpen className="h-5 w-5" />}
            isActive={location === "/admin/courses"}
          >
            Courses
          </SidebarLink>
          <SidebarLink
            href="/admin/exams"
            icon={<ClipboardList className="h-5 w-5" />}
            isActive={location === "/admin/exams"}
          >
            Exams
          </SidebarLink>
          <SidebarLink
            href="/admin/students"
            icon={<Users className="h-5 w-5" />}
            isActive={location === "/admin/students"}
          >
            Students
          </SidebarLink>
          <SidebarLink
            href="/admin/batches"
            icon={<UsersRound className="h-5 w-5" />}
            isActive={location === "/admin/batches"}
          >
            Batches
          </SidebarLink>
          <SidebarLink
            href="/admin/reports"
            icon={<BarChart2 className="h-5 w-5" />}
            isActive={location === "/admin/reports"}
          >
            Reports
          </SidebarLink>

          <p className="px-6 pt-5 pb-1 text-xs font-semibold text-neutral-medium uppercase">
            Account
          </p>
          <SidebarLink
            href="/admin/profile"
            icon={<UserIcon className="h-5 w-5" />}
            isActive={location === "/admin/profile"}
          >
            Profile
          </SidebarLink>
        </div>
      ) : (
        <div className="py-4">
          <p className="px-6 py-1 text-xs font-semibold text-neutral-medium uppercase">
            Learning
          </p>
          <SidebarLink
            href="/student/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            isActive={location === "/student/dashboard" || location === "/"}
          >
            Dashboard
          </SidebarLink>
          <SidebarLink
            href="/student/my-courses"
            icon={<BookOpenCheck className="h-5 w-5" />}
            isActive={location === "/student/my-courses"}
          >
            My Courses
          </SidebarLink>
          <SidebarLink
            href="/student/upcoming-exams"
            icon={<CalendarClock className="h-5 w-5" />}
            isActive={location === "/student/upcoming-exams"}
          >
            Upcoming Exams
          </SidebarLink>
          <SidebarLink
            href="/student/results"
            icon={<PieChart className="h-5 w-5" />}
            isActive={location === "/student/results"}
          >
            Results & Progress
          </SidebarLink>
          <SidebarLink
            href="/student/ai-assistant"
            icon={<Bot className="h-5 w-5" />}
            isActive={location === "/student/ai-assistant"}
          >
            AI Assistant
          </SidebarLink>

          <p className="px-6 pt-5 pb-1 text-xs font-semibold text-neutral-medium uppercase">
            Account
          </p>
          <SidebarLink
            href="/student/profile"
            icon={<UserIcon className="h-5 w-5" />}
            isActive={location === "/student/profile"}
          >
            My Profile
          </SidebarLink>
        </div>
      )}

      <div className="px-6 py-4 mt-auto border-t border-neutral-light">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-gray-600 font-semibold">
            {user.firstName?.charAt(0)}
            {user.lastName?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-neutral-medium capitalize">
              {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`group mt-4 w-full text-left flex items-center text-sm p-2 rounded-md transition-all duration-300 transform 
            ${isLoggingOut 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'text-neutral-dark hover:text-error hover:bg-red-50 hover:translate-x-1'
            }`}
        >
          {isLoggingOut ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent border-primary"></div>
              <span className="flex items-center">
                Signing Out
                <span className="ml-1 inline-flex">
                  <span className="animate-pulse delay-0">.</span>
                  <span className="animate-pulse delay-150">.</span>
                  <span className="animate-pulse delay-300">.</span>
                </span>
              </span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              Sign Out
            </>
          )}
        </button>
      </div>
    </div>
  );
}
