import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import GanttPage from "@/pages/gantt";
import ChecklistPage from "@/pages/checklist";
import EvergreenPage from "@/pages/evergreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GanttPage} />
      <Route path="/checklist" component={ChecklistPage} />
      <Route path="/evergreen" component={EvergreenPage} />
      <Route component={NotFound} />
    </Switch>
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
