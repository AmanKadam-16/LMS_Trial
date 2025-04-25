import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useSidebar } from "@/hooks/use-sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-neutral-lightest">
      <Sidebar />
      
      <div className={`main-content flex-grow p-6 md:p-8 ${sidebarOpen ? 'md:ml-64' : 'ml-0'} transition-all duration-300`}>
        {children}
      </div>
      
      <MobileNav />
    </div>
  );
}