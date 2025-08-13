import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTask, Release } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, User, CheckCircle, Clock, Users, BarChart3, Download, ArrowUpDown, Star, AlertTriangle, ExternalLink, ArrowLeft, Pause, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Navigation, MobileNavigation } from "@/components/ui/navigation";

const teamMembers = ["Brian", "Alex", "Lucas", "Victor"];

type SortOption = "completed" | "to-complete" | "priority" | "paused";

export default function ChecklistPage() {
  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskUrl, setNewTaskUrl] = useState("");
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [sortBy, setSortBy] = useState<Record<string, SortOption>>({});
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [selectedTaskForBlocker, setSelectedTaskForBlocker] = useState<string | null>(null);
  const [blockerReason, setBlockerReason] = useState("");
  const [blockerRequestedBy, setBlockerRequestedBy] = useState("");
  const [blockerDetailsModalOpen, setBlockerDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<ChecklistTask | null>(null);
  
  const queryClient = useQueryClient();

  // Auto-generate evergreen tasks on initial load if none exist
  const { data: evergreenBoxes = [] } = useQuery({
    queryKey: ["/api/evergreen-boxes"],
  });

  // Fetch all checklist tasks
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<ChecklistTask[]>({
    queryKey: ["/api/checklist-tasks"],
  });

  // Check if we need to generate evergreen tasks
  useEffect(() => {
    const evergreenTasks = allTasks.filter(task => task.evergreenBoxId);
    const boxesWithCycles = evergreenBoxes.filter((box: {waterfallCycleId?: string}) => box.waterfallCycleId);
    
    // If we have evergreen boxes with cycles but no evergreen tasks, generate them
    if (boxesWithCycles.length > 0 && evergreenTasks.length === 0) {
      console.log("No evergreen tasks found, generating them...");
      fetch("/api/evergreen-tasks/generate", { method: "POST" })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
        })
        .catch(console.error);
    }
  }, [allTasks, evergreenBoxes, queryClient]);

  // Fetch all releases for the dropdown
  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  // Fetch all release groups for accent colors
  const { data: groups = [] } = useQuery<Array<{
    id: string;
    name: string;
    color: string;
  }>>({
    queryKey: ["/api/release-groups"],
  });

  // Filter tasks by selected member
  const memberTasks = allTasks.filter(task => task.assignedTo === selectedMember);

  // Group tasks by release and evergreen - always include evergreen section
  const tasksByRelease = memberTasks.reduce((acc, task) => {
    let groupId;
    if (task.evergreenBoxId) {
      groupId = 'evergreen';
    } else {
      groupId = task.releaseId || 'unassigned';
    }
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(task);
    return acc;
  }, {} as Record<string, ChecklistTask[]>);

  // Ensure evergreen section always exists, even if empty
  if (!tasksByRelease['evergreen']) {
    tasksByRelease['evergreen'] = [];
  }

  // Calculate completion percentage for each release
  const getReleaseProgress = (releaseId: string) => {
    const releaseTasks = allTasks.filter(task => task.releaseId === releaseId);
    if (releaseTasks.length === 0) return 0;
    const completedTasks = releaseTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / releaseTasks.length) * 100);
  };

  // Update task completion
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      return apiRequest('PUT', `/api/checklist-tasks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
    }
  });

  // Report blocker mutation
  const reportBlockerMutation = useMutation({
    mutationFn: async ({ id, blockerReason, blockerRequestedBy }: { 
      id: string, 
      blockerReason: string, 
      blockerRequestedBy: string 
    }) => {
      return apiRequest('PUT', `/api/checklist-tasks/${id}`, { 
        paused: true,
        blockerReason,
        blockerRequestedBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      setBlockerModalOpen(false);
      setSelectedTaskForBlocker(null);
      setBlockerReason("");
      setBlockerRequestedBy("");
    }
  });

  // Unpause task mutation
  const unpauseTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PUT', `/api/checklist-tasks/${id}`, { 
        paused: false,
        blockerReason: null,
        blockerRequestedBy: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  // Create new task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { releaseId: string, assignedTo: string, taskTitle: string, taskUrl?: string }) => {
      return apiRequest('POST', '/api/checklist-tasks', taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      setNewTaskTitle("");
      setNewTaskUrl("");
      setSelectedReleaseId("");
    }
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({ id: taskId, completed });
  };

  const handleReportBlocker = (taskId: string) => {
    setSelectedTaskForBlocker(taskId);
    setBlockerModalOpen(true);
  };

  const handleUnpauseTask = (taskId: string) => {
    unpauseTaskMutation.mutate(taskId);
  };

  const handleViewBlockerDetails = (task: ChecklistTask) => {
    setSelectedTaskForDetails(task);
    setBlockerDetailsModalOpen(true);
  };

  const handleSubmitBlocker = () => {
    if (selectedTaskForBlocker && blockerReason && blockerRequestedBy) {
      reportBlockerMutation.mutate({
        id: selectedTaskForBlocker,
        blockerReason,
        blockerRequestedBy
      });
    }
  };

  const handleCreateTask = () => {
    if (newTaskTitle && selectedReleaseId) {
      createTaskMutation.mutate({
        releaseId: selectedReleaseId === 'general' ? 'general' : selectedReleaseId,
        assignedTo: selectedMember,
        taskTitle: newTaskTitle,
        taskUrl: newTaskUrl || undefined
      });
    }
  };

  // Helper function to check if a task is high priority (based on release)
  const isTaskHighPriority = (task: ChecklistTask) => {
    const release = releases.find(r => r.id === task.releaseId);
    return release?.highPriority || false;
  };

  // Sorting function
  const getSortedTasks = (tasks: ChecklistTask[], sortOption: SortOption) => {
    return [...tasks].sort((a, b) => {
      switch (sortOption) {
        case "completed":
          return (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
        case "to-complete":
          return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
        case "priority":
          return (isTaskHighPriority(b) ? 1 : 0) - (isTaskHighPriority(a) ? 1 : 0);
        case "paused":
          return (b.paused ? 1 : 0) - (a.paused ? 1 : 0);
        default:
          return 0;
      }
    });
  };

  // Calculate days remaining until release starts
  const getDaysRemaining = (releaseId: string) => {
    const release = releases.find(r => r.id === releaseId);
    if (!release) return 0;
    
    const now = new Date();
    const startDate = new Date(release.startDate);
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Export functionality
  const exportChecklist = (member: string) => {
    const memberTasks = allTasks.filter(task => task.assignedTo === member);
    const exportData = {
      member,
      exportDate: new Date().toISOString(),
      tasks: memberTasks.map(task => ({
        title: task.taskTitle,
        description: task.taskDescription,
        url: task.taskUrl,
        priority: isTaskHighPriority(task),
        completed: task.completed,
        release: releases.find(r => r.id === task.releaseId)?.name || 'Unknown',
        createdAt: task.createdAt,
        completedAt: task.completedAt
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member}-checklist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (tasksLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading checklist...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Team Checklist
            </h1>
            <Link href="/">
              <Button variant="ghost" className="p-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gantt Chart
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Track task completion for all team members across projects
          </p>
        </div>

      <Tabs value={selectedMember} onValueChange={setSelectedMember}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {teamMembers.map(member => {
            const memberTasksCount = allTasks.filter(task => task.assignedTo === member);
            const completedCount = memberTasksCount.filter(task => task.completed).length;
            const priorityCount = memberTasksCount.filter(task => {
              const release = releases.find(r => r.id === task.releaseId);
              return (release?.highPriority || false) && !task.completed; // Only count incomplete priority tasks
            }).length;
            const pausedCount = memberTasksCount.filter(task => task.paused).length;
            
            return (
              <TabsTrigger key={member} value={member} className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{member}</span>
                <div className="flex items-center space-x-1 ml-2">
                  <Badge variant="outline">
                    {completedCount}/{memberTasksCount.length}
                  </Badge>
                  {priorityCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      {priorityCount}
                    </Badge>
                  )}
                  {pausedCount > 0 && (
                    <Badge className="text-xs bg-orange-500 hover:bg-orange-600 text-white">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {pausedCount}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {teamMembers.map(member => (
          <TabsContent key={member} value={member}>
            <div className="space-y-6">
              {/* Add New Task Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add New Task for {member}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                      </div>
                      <div className="w-64">
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={selectedReleaseId}
                          onChange={(e) => setSelectedReleaseId(e.target.value)}
                        >
                          <option value="">Select Project...</option>
                          <option value="general">General Tasks</option>
                          {releases.map(release => (
                            <option key={release.id} value={release.id}>
                              {release.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Input
                          placeholder="URL/Links (optional)..."
                          value={newTaskUrl}
                          onChange={(e) => setNewTaskUrl(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={handleCreateTask}
                        disabled={!newTaskTitle || !selectedReleaseId || createTaskMutation.isPending}
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Project Checklists */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Project Checklists</h3>
                  {Object.entries(tasksByRelease)
                    .filter(([releaseId]) => releaseId !== 'evergreen' && releases.find(r => r.id === releaseId))
                    .sort(([releaseIdA], [releaseIdB]) => {
                      const releaseA = releases.find(r => r.id === releaseIdA);
                      const releaseB = releases.find(r => r.id === releaseIdB);
                      const priorityA = releaseA?.highPriority ? 1 : 0;
                      const priorityB = releaseB?.highPriority ? 1 : 0;
                      return priorityB - priorityA; // High priority first
                    })
                    .map(([releaseId, tasks]) => {
                const release = releases.find(r => r.id === releaseId);
                const releaseProgress = getReleaseProgress(releaseId);
                const memberSortOption = sortBy[member] || "priority";
                const sortedTasks = getSortedTasks(tasks, memberSortOption);
                const daysRemaining = getDaysRemaining(releaseId);
                const isHighPriority = release?.highPriority || false;
                
                return (
                  <Card 
                    key={releaseId}
                    className={isHighPriority ? 'ring-2 ring-red-400 ring-opacity-60' : ''}
                  >
                    <CardHeader>
                      <CardTitle>
                        {/* Project Title */}
                        <div className="mb-3">
                          <span className="text-xl font-bold flex items-center">
                            <div 
                              className="w-1 h-6 rounded-full mr-3"
                              style={{ 
                                backgroundColor: release?.groupId 
                                  ? groups.find((g: any) => g.id === release.groupId)?.color || '#6B7280'
                                  : '#6B7280' 
                              }}
                            />
                            {release?.name || 'Unassigned Tasks'}
                          </span>
                        </div>
                        
                        {/* Metrics and Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant={releaseProgress === 100 ? "default" : "outline"}>
                              {isNaN(releaseProgress) ? 0 : releaseProgress}% Complete
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {daysRemaining} days remaining
                            </Badge>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <CheckCircle className="w-4 h-4" />
                              <span>{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <ArrowUpDown className="w-4 h-4 text-gray-500" />
                            <select 
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                              value={memberSortOption}
                              onChange={(e) => setSortBy(prev => ({ 
                                ...prev, 
                                [member]: e.target.value as SortOption 
                              }))}
                            >
                              <option value="priority">Priority</option>
                              <option value="completed">Completed</option>
                              <option value="to-complete">To Complete</option>
                              <option value="paused">Paused</option>
                            </select>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sortedTasks.map(task => (
                          <div
                            key={task.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border ${
                              task.completed 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : task.paused
                                ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                            }`}
                          >
                            <Checkbox
                              checked={task.completed || false}
                              onCheckedChange={(checked) => 
                                handleTaskToggle(task.id, !!checked)
                              }
                            />
                            <div className="flex-1">
                              <div className={`font-medium flex items-center space-x-2 ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                              }`}>
                                <span>{task.taskTitle}</span>
                                {isTaskHighPriority(task) && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              {task.taskDescription && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {task.taskDescription}
                                </div>
                              )}
                              {task.taskUrl && (
                                <div className="mt-2">
                                  <a 
                                    href={task.taskUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>View Link</span>
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {task.completed ? (
                                <Badge 
                                  className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors text-xs"
                                  onClick={() => window.location.href = '/calendar'}
                                >
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Add to Calendar
                                </Badge>
                              ) : (
                                task.paused ? (
                                  <Badge 
                                    className="bg-green-500 text-white cursor-pointer hover:bg-green-600 transition-colors text-xs"
                                    onClick={() => handleViewBlockerDetails(task)}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Unpause
                                  </Badge>
                                ) : (
                                  <Badge 
                                    className="bg-orange-500 text-white cursor-pointer hover:bg-orange-600 transition-colors text-xs"
                                    onClick={() => handleReportBlocker(task.id)}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                  </Badge>
                                )
                              )}
                              {task.completed ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Done
                                </Badge>
                              ) : task.paused ? (
                                <Badge 
                                  className="bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors text-xs"
                                  onClick={() => handleViewBlockerDetails(task)}
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Paused
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                    );
                  })}
                </div>

                {/* Column 2: Evergreen and General */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Other Tasks</h3>
                  
                  {/* Evergreen Content */}
                  {Object.entries(tasksByRelease)
                    .filter(([releaseId]) => releaseId === 'evergreen')
                    .map(([releaseId, tasks]) => {
                      const memberSortOption = sortBy[`${member}-evergreen`] || "priority";
                      const sortedTasks = getSortedTasks(tasks, memberSortOption);
                      
                      return (
                        <Card key={releaseId}>
                          <CardHeader>
                            <CardTitle>
                              {/* Evergreen Title */}
                              <div className="mb-3">
                                <span className="text-xl font-bold flex items-center">
                                  <div className="w-1 h-6 rounded-full mr-3 bg-green-500" />
                                  Evergreen Content
                                </span>
                              </div>
                              
                              {/* Metrics and Controls */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}% Complete
                                  </Badge>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                                  <select 
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                    value={memberSortOption}
                                    onChange={(e) => setSortBy(prev => ({ 
                                      ...prev, 
                                      [member]: e.target.value as SortOption 
                                    }))}
                                  >
                                    <option value="priority">Priority</option>
                                    <option value="completed">Completed</option>
                                    <option value="to-complete">To Complete</option>
                                    <option value="paused">Paused</option>
                                  </select>
                                </div>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {sortedTasks.map(task => (
                                <div
                                  key={task.id}
                                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                    task.completed 
                                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                      : task.paused
                                      ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                  }`}
                                >
                                  <Checkbox
                                    checked={task.completed || false}
                                    onCheckedChange={(checked) => 
                                      handleTaskToggle(task.id, !!checked)
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className={`font-medium ${
                                      task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                    }`}>
                                      {task.taskTitle}
                                    </div>
                                    {task.taskDescription && (
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {task.taskDescription}
                                      </div>
                                    )}
                                    {task.taskUrl && (
                                      <div className="text-sm text-blue-600 hover:text-blue-800 mt-1">
                                        <a href={task.taskUrl} target="_blank" rel="noopener noreferrer">
                                          View Link
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {task.completed ? (
                                      <Badge 
                                        className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors text-xs"
                                        onClick={() => window.location.href = '/calendar'}
                                      >
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Add to Calendar
                                      </Badge>
                                    ) : (
                                      task.paused ? (
                                        <Badge 
                                          className="bg-green-500 text-white cursor-pointer hover:bg-green-600 transition-colors text-xs"
                                          onClick={() => handleViewBlockerDetails(task)}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Unpause
                                        </Badge>
                                      ) : (
                                        <Badge 
                                          className="bg-orange-500 text-white cursor-pointer hover:bg-orange-600 transition-colors text-xs"
                                          onClick={() => handleReportBlocker(task.id)}
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                        </Badge>
                                      )
                                    )}
                                    {task.completed ? (
                                      <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Done
                                      </Badge>
                                    ) : task.paused ? (
                                      <Badge 
                                        className="bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors text-xs"
                                        onClick={() => handleViewBlockerDetails(task)}
                                      >
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Paused
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                  {/* General Checklist */}
                  {Object.entries(tasksByRelease)
                    .filter(([releaseId]) => releaseId === 'general')
                    .map(([releaseId, tasks]) => {
                      const memberSortOption = sortBy[`${member}-general`] || "priority";
                      const sortedTasks = getSortedTasks(tasks, memberSortOption);
                      
                      return (
                        <Card key={releaseId}>
                          <CardHeader>
                            <CardTitle>
                              {/* General Tasks Title */}
                              <div className="mb-3">
                                <span className="text-xl font-bold flex items-center">
                                  <div className="w-1 h-6 rounded-full mr-3 bg-purple-500" />
                                  General Tasks
                                </span>
                              </div>
                              
                              {/* Metrics and Controls */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}% Complete
                                  </Badge>
                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                                  <select 
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                    value={memberSortOption}
                                    onChange={(e) => setSortBy(prev => ({ 
                                      ...prev, 
                                      [member]: e.target.value as SortOption 
                                    }))}
                                  >
                                    <option value="priority">Priority</option>
                                    <option value="completed">Completed</option>
                                    <option value="to-complete">To Complete</option>
                                    <option value="paused">Paused</option>
                                  </select>
                                </div>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {tasks.length > 0 ? (
                              <div className="space-y-3">
                                {sortedTasks.map(task => (
                                  <div
                                    key={task.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                      task.completed 
                                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                        : task.paused
                                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                    }`}
                                  >
                                    <Checkbox
                                      checked={task.completed || false}
                                      onCheckedChange={(checked) => 
                                        handleTaskToggle(task.id, !!checked)
                                      }
                                    />
                                    <div className="flex-1">
                                      <div className={`font-medium ${
                                        task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {task.taskTitle}
                                      </div>
                                      {task.taskDescription && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {task.taskDescription}
                                        </div>
                                      )}
                                      {task.taskUrl && (
                                        <div className="text-sm text-blue-600 hover:text-blue-800 mt-1">
                                          <a href={task.taskUrl} target="_blank" rel="noopener noreferrer">
                                            View Link
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {task.completed ? (
                                        <Badge 
                                          className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors text-xs"
                                          onClick={() => window.location.href = '/calendar'}
                                        >
                                          <Calendar className="w-3 h-3 mr-1" />
                                          Add to Calendar
                                        </Badge>
                                      ) : (
                                        task.paused ? (
                                          <Badge 
                                            className="bg-green-500 text-white cursor-pointer hover:bg-green-600 transition-colors text-xs"
                                            onClick={() => handleViewBlockerDetails(task)}
                                          >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Unpause
                                          </Badge>
                                        ) : (
                                          <Badge 
                                            className="bg-orange-500 text-white cursor-pointer hover:bg-orange-600 transition-colors text-xs"
                                            onClick={() => handleReportBlocker(task.id)}
                                          >
                                            <AlertTriangle className="w-3 h-3" />
                                          </Badge>
                                        )
                                      )}
                                      {task.completed ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Done
                                        </Badge>
                                      ) : task.paused ? (
                                        <Badge 
                                          className="bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors text-xs"
                                          onClick={() => handleViewBlockerDetails(task)}
                                        >
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Paused
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4" />
                                <p>General tasks will appear here</p>
                                <p className="text-sm">For tasks outside of projects and evergreen content</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  
                  {/* Show empty state if no general tasks exist */}
                  {!Object.keys(tasksByRelease).includes('general') && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {/* General Tasks Title */}
                          <div className="mb-3">
                            <span className="text-xl font-bold flex items-center">
                              <div className="w-1 h-6 rounded-full mr-3 bg-purple-500" />
                              General Tasks
                            </span>
                          </div>
                          
                          {/* Metrics and Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary" className="text-xs">
                                Non-project tasks
                              </Badge>
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4" />
                          <p>General tasks will appear here</p>
                          <p className="text-sm">For tasks outside of projects and evergreen content</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {memberTasks.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No tasks assigned to {member} yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      </div>
      
      {/* Report Blocker Modal */}
      <Dialog open={blockerModalOpen} onOpenChange={setBlockerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report a Blocker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blocker-reason">New Task</Label>
              <Textarea
                id="blocker-reason"
                placeholder="Describe the blocking issue or new task that needs to be handled..."
                value={blockerReason}
                onChange={(e) => setBlockerReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="blocker-requested-by">Requested By</Label>
              <Input
                id="blocker-requested-by"
                placeholder="Who requested this blocking work?"
                value={blockerRequestedBy}
                onChange={(e) => setBlockerRequestedBy(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setBlockerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitBlocker}
                disabled={!blockerReason || !blockerRequestedBy || reportBlockerMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Pause Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocker Details Modal */}
      <Dialog open={blockerDetailsModalOpen} onOpenChange={setBlockerDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Blocker Details</DialogTitle>
          </DialogHeader>
          {selectedTaskForDetails && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Task</Label>
                <p className="mt-1 text-sm text-gray-900">{selectedTaskForDetails.taskTitle}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Blocking Issue</Label>
                <p className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded-md">
                  {selectedTaskForDetails.blockerReason || "No reason provided"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Requested By</Label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTaskForDetails.blockerRequestedBy || "Unknown"}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setBlockerDetailsModalOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleUnpauseTask(selectedTaskForDetails.id);
                    setBlockerDetailsModalOpen(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Unpause Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}