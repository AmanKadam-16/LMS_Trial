import { createContext, ReactNode, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to open on larger screens
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Toggle sidebar state
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
    // Save preference to localStorage
    localStorage.setItem("sidebar-open", String(!sidebarOpen));
  };

  // Load preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem("sidebar-open");
    if (savedPreference !== null) {
      setSidebarOpen(savedPreference === "true");
    }
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}