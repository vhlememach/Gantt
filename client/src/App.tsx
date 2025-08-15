import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { AppSettings } from "@shared/schema";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogOut, Settings, BarChart3, Calendar as CalendarIcon, CheckSquare, Repeat, Palette, Download, ChevronDown, Upload, Ungroup, Users, Shuffle, FileJson, Image, FileType, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import NotFound from "@/pages/not-found";
import GanttPage from "@/pages/gantt";
import ChecklistPage from "@/pages/checklist";
import EvergreenPage from "@/pages/evergreen";
import CalendarPage from "@/pages/calendar";
import Login from "@/pages/login";
import Admin from "@/pages/admin";
import AdminSimple from "@/pages/admin-simple";

function AdminDropdown() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  if (!user?.isAdmin) {
    return null;
  }

  const handleAdminAction = (action: string, detail?: any) => {
    // Prevent default behavior that causes navigation
    if (action.startsWith('gantt:')) {
      // Navigate to gantt page if not there, then execute action
      if (location !== '/') {
        window.location.href = '/';
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent(action, detail ? { detail } : undefined));
        }, 100);
      } else {
        window.dispatchEvent(new CustomEvent(action, detail ? { detail } : undefined));
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/20 text-black bg-white/90 hover:bg-white hover:text-black">
          <Settings className="h-4 w-4 mr-2 text-black" />
          <span className="text-black">Admin</span>
          <ChevronDown className="ml-2 h-4 w-4 text-black" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Customize Options */}
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:open-groups'); }}>
          <Users className="mr-2 h-4 w-4" />
          Groups
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:open-waterfall'); }}>
          <Shuffle className="mr-2 h-4 w-4" />
          Waterfall Cycles
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:open-header'); }}>
          <Palette className="mr-2 h-4 w-4" />
          Header & Style
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:open-status'); }}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Status Colors
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Export Options */}
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:export', 'json'); }}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:import'); }}>
          <Upload className="mr-2 h-4 w-4" />
          Import from JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:export', 'png'); }}>
          <Image className="mr-2 h-4 w-4" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleAdminAction('gantt:export', 'pdf'); }}>
          <FileType className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Admin Panel */}
        <DropdownMenuItem onClick={(e) => { e.preventDefault(); window.location.href = '/admin'; }}>
          <Settings className="mr-2 h-4 w-4" />
          Admin Panel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Navigation() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();
  
  // Query settings to get custom header title and styling
  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

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
    <nav 
      className="border-b border-purple-200 dark:border-purple-700 px-4 py-3"
      style={{
        background: settings?.headerBackgroundColor ? 
          `linear-gradient(135deg, ${settings.headerBackgroundColor}, ${settings.buttonColor || settings.headerBackgroundColor})` : 
          'linear-gradient(135deg, #7c3aed, #a855f7)'
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <h1 
            className="text-xl font-bold text-white"
            style={{
              color: settings?.headerTitleColor || '#ffffff',
              fontFamily: settings?.fontFamily || undefined
            }}
          >
            {settings?.headerTitle || "Palmyra Project Management"}
          </h1>
          
          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <Button
                  variant={location === path ? "secondary" : "ghost"}
                  size="sm"
                  className={`
                    flex items-center space-x-2 border-0
                    ${location === path 
                      ? "bg-purple-300/30 text-white hover:bg-purple-300/40" 
                      : "text-white hover:text-white hover:bg-purple-600/20"
                    }
                  `}
                >
                  <Icon className="h-4 w-4 text-white" />
                  <span className="text-white">{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-white/90">
            {user?.email}
          </span>
          
          <AdminDropdown />

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="border-white/20 text-black bg-white/90 hover:bg-white hover:text-black"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-black" />
            ) : (
              <LogOut className="h-4 w-4 mr-2 text-black" />
            )}
            <span className="text-black">Sign Out</span>
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
  if (!isAuthenticated && !isLoading && isUnauthenticated) {
    return <Login />;
  }

  // If we have no clear authentication state but not loading, show main app
  // This prevents blank pages during authentication transitions

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
