import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogOut, Settings, BarChart3, Calendar as CalendarIcon, CheckSquare, Repeat } from "lucide-react";
import NotFound from "@/pages/not-found";
import GanttPage from "@/pages/gantt";
import ChecklistPage from "@/pages/checklist";
import EvergreenPage from "@/pages/evergreen";
import CalendarPage from "@/pages/calendar";
import Login from "@/pages/login";
import Admin from "@/pages/admin";

function Navigation() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { path: "/", label: "Gantt Chart", icon: BarChart3 },
    { path: "/checklist", label: "Checklist", icon: CheckSquare },
    { path: "/evergreen", label: "Evergreen", icon: Repeat },
    { path: "/calendar", label: "Calendar", icon: CalendarIcon },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Palmyra Project Management
          </h1>
          
          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <Button
                  variant={location === path ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.email}
          </span>
          
          {user?.isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const { isAuthenticated, isUnauthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();
  
  console.log("Current location:", location);
  console.log("Auth state:", { isAuthenticated, isUnauthenticated, isLoading, user });
  
  // Show loading spinner while checking authentication - but never for too long
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show login page only if we're definitely not authenticated
  if (!isAuthenticated && !isLoading) {
    return <Login />;
  }

  // Fallback: if no authentication state, show main app to prevent blank pages
  // This ensures users never get stuck with blank pages

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-7xl mx-auto">
        <Switch>
          <Route path="/" component={GanttPage} />
          <Route path="/gantt" component={GanttPage} />
          <Route path="/checklist" component={ChecklistPage} />
          <Route path="/evergreen" component={EvergreenPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
