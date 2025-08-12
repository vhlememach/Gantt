import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, CheckSquare, Megaphone } from "lucide-react";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      path: "/",
      label: "Gantt Chart",
      icon: BarChart3,
      description: "Project timeline and release management"
    },
    {
      path: "/checklist", 
      label: "Checklist",
      icon: CheckSquare,
      description: "Task management and assignments"
    },
    {
      path: "/evergreen",
      label: "Evergreen",
      icon: Megaphone,
      description: "Monthly recurring content campaigns"
    }
  ];

  return (
    <nav className={cn("flex items-center space-x-6", className)}>
      {navigationItems.map((item) => {
        const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-[#7232d9] text-white"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation({ className }: NavigationProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      path: "/",
      label: "Gantt",
      icon: BarChart3,
    },
    {
      path: "/checklist", 
      label: "Tasks",
      icon: CheckSquare,
    },
    {
      path: "/evergreen",
      label: "Evergreen",
      icon: Megaphone,
    }
  ];

  return (
    <nav className={cn("flex items-center justify-around bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700", className)}>
      {navigationItems.map((item) => {
        const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 text-xs font-medium transition-colors min-w-0 flex-1",
              isActive
                ? "text-[#7232d9]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}