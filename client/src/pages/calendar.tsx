import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTask, Release, ReleaseGroup } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle, Star, AlertTriangle, ExternalLink, ArrowLeft, Palette } from "lucide-react";
import { Link } from "wouter";
import { Navigation, MobileNavigation } from "@/components/ui/navigation";

interface CalendarTask {
  id: string;
  taskTitle: string;
  taskDescription?: string;
  taskUrl?: string;
  assignedTo: string;
  releaseId: string;
  releaseName?: string;
  releaseGroup?: string;
  releaseColor?: string;
  releaseIcon?: string;
  priority: boolean;
  scheduledDate?: string;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const isDateInReleaseRange = (date: Date, release: Release) => {
  const startDate = new Date(release.startDate);
  const endDate = new Date(release.endDate);
  return date >= startDate && date <= endDate;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const queryClient = useQueryClient();

  // Fetch completed tasks
  const { data: completedTasks = [] } = useQuery({
    queryKey: ["/api/checklist-tasks"],
    select: (data: ChecklistTask[]) => data.filter(task => task.completed)
  });

  // Fetch releases
  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["/api/releases"]
  });

  // Fetch release groups
  const { data: releaseGroups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"]
  });

  // Combine tasks with release information
  const tasksWithReleaseInfo: CalendarTask[] = completedTasks.map(task => {
    const release = releases.find(r => r.id === task.releaseId);
    const group = release ? releaseGroups.find(g => g.id === release.groupId) : null;
    
    return {
      id: task.id,
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription || undefined,
      taskUrl: task.taskUrl || undefined,
      assignedTo: task.assignedTo,
      releaseId: task.releaseId || 'evergreen',
      releaseName: release?.name || 'Evergreen',
      releaseGroup: group?.name || 'General',
      releaseColor: group?.color || '#6b7280',
      releaseIcon: release?.icon || 'fas fa-calendar',
      priority: task.priority || false,
      scheduledDate: task.scheduledDate
    };
  });

  // Filter unscheduled tasks for sidebar
  const unscheduledTasks = tasksWithReleaseInfo.filter(task => !task.scheduledDate);
  
  // Filter scheduled tasks for calendar
  const scheduledTasks = tasksWithReleaseInfo.filter(task => task.scheduledDate);

  // Group unscheduled tasks by release
  const tasksByRelease = unscheduledTasks.reduce((acc, task) => {
    const key = task.releaseId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    return acc;
  }, {} as Record<string, CalendarTask[]>);
  
  // Build calendar tasks from scheduled tasks (computed directly)
  const calendarTasksFromScheduled = scheduledTasks.reduce((acc, task) => {
    if (task.scheduledDate) {
      if (!acc[task.scheduledDate]) {
        acc[task.scheduledDate] = [];
      }
      acc[task.scheduledDate].push(task);
    }
    return acc;
  }, {} as Record<string, CalendarTask[]>);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleDragStart = (task: CalendarTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Mutation to schedule a task
  const scheduleTaskMutation = useMutation({
    mutationFn: async ({ taskId, scheduledDate }: { taskId: string; scheduledDate: string }) => {
      return apiRequest(`/api/checklist-tasks/${taskId}/schedule`, {
        method: "PATCH",
        body: { scheduledDate }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  // Mutation to unschedule a task
  const unscheduleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/checklist-tasks/${taskId}/unschedule`, {
        method: "PATCH"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!draggedTask) return;

    const dropDate = new Date(selectedYear, selectedMonth, day);
    const release = releases.find(r => r.id === draggedTask.releaseId);
    
    // Check if the date is within the release range (skip for evergreen tasks)
    if (release && draggedTask.releaseId !== 'evergreen' && !isDateInReleaseRange(dropDate, release)) {
      alert(`Task can only be scheduled within the release period: ${new Date(release.startDate).toLocaleDateString()} - ${new Date(release.endDate).toLocaleDateString()}`);
      return;
    }

    // Update task with scheduled date
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    try {
      await scheduleTaskMutation.mutateAsync({
        taskId: draggedTask.id,
        scheduledDate: dateKey
      });
      
      // Remove task from local state since it will be refetched
      // The actual update will come from the server invalidation
    } catch (error) {
      console.error('Failed to schedule task:', error);
      alert('Failed to schedule task. Please try again.');
    }

    setDraggedTask(null);
  };

  const handleTaskClick = async (task: CalendarTask) => {
    if (confirm(`Remove "${task.taskTitle}" from calendar?`)) {
      try {
        await unscheduleTaskMutation.mutateAsync(task.id);
      } catch (error) {
        console.error('Failed to unschedule task:', error);
        alert('Failed to remove task from calendar. Please try again.');
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Get tasks for a specific day, grouped by release
  const getTasksForDay = (day: number) => {
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = calendarTasksFromScheduled[dateKey] || [];
    
    // Group by release
    const tasksByRelease = dayTasks.reduce((acc, task) => {
      const releaseId = task.releaseId;
      if (!acc[releaseId]) {
        acc[releaseId] = {
          release: releases.find(r => r.id === releaseId),
          tasks: []
        };
      }
      acc[releaseId].tasks.push(task);
      return acc;
    }, {} as Record<string, { release?: Release; tasks: CalendarTask[] }>);

    return tasksByRelease;
  };

  // Get releases active on a specific day
  const getReleasesForDay = (day: number) => {
    const currentDate = new Date(selectedYear, selectedMonth, day);
    return releases.filter(release => {
      const startDate = new Date(release.startDate);
      const endDate = new Date(release.endDate);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Completed Tasks */}
        <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Completed Tasks
              </h2>
              <Badge variant="secondary">
                {unscheduledTasks.length} unscheduled
              </Badge>
            </div>

            <div className="space-y-4">
              {Object.entries(tasksByRelease).map(([releaseId, tasks]) => {
                const release = releases.find(r => r.id === releaseId);
                const group = release ? releaseGroups.find(g => g.id === release.groupId) : null;
                
                return (
                  <Card key={releaseId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {release?.name || 'Evergreen'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {tasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {task.taskTitle}
                                </span>
                                {task.priority && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Assigned to {task.assignedTo}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Done
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {unscheduledTasks.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No completed tasks to schedule yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Calendar */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Gantt
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {monthNames[selectedMonth]} {selectedYear}
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Colors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  Next →
                </Button>
              </div>
            </div>

            {/* Color Picker Panel */}
            {showColorPicker && (
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Release Group Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {releaseGroups.map(group => (
                    <div key={group.id} className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {group.name}
                      </span>
                      <div className="flex space-x-1">
                        {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'].map(color => (
                          <button
                            key={color}
                            className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              // Simple color update - in real app would use mutation
                              const updatedGroups = releaseGroups.map(g => 
                                g.id === group.id ? { ...g, color } : g
                              );
                              queryClient.setQueryData(["/api/release-groups"], updatedGroups);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-4">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-32"></div>;
                }

                const tasksForDay = getTasksForDay(day);
                const releasesForDay = getReleasesForDay(day);
                const currentDate = new Date();
                const isToday = 
                  day === currentDate.getDate() && 
                  selectedMonth === currentDate.getMonth() && 
                  selectedYear === currentDate.getFullYear();

                return (
                  <div
                    key={day}
                    className={`min-h-32 p-2 border border-gray-200 dark:border-gray-700 rounded-lg ${
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : 'bg-white dark:bg-gray-800'
                    } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day}
                      </span>
                    </div>

                    {/* Release dividers for active releases */}
                    <div className="space-y-2">
                      {releasesForDay.map(release => {
                        const group = releaseGroups.find(g => g.id === release.groupId);
                        const releaseTasks = tasksForDay[release.id]?.tasks || [];
                        
                        return (
                          <div key={release.id} className="space-y-1">
                            {/* Release divider box */}
                            <div 
                              className="text-xs font-medium px-2 py-1 rounded text-white opacity-80"
                              style={{ backgroundColor: group?.color || '#6b7280' }}
                            >
                              <i className={`${release.icon} mr-1`}></i>
                              {release.name}
                            </div>
                            
                            {/* Tasks under this release */}
                            {releaseTasks.map(task => (
                              <div
                                key={task.id}
                                className="text-xs p-1 bg-gray-100 dark:bg-gray-600 rounded truncate cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors ml-2"
                                title={`${task.taskTitle} - Click to remove`}
                                onClick={() => handleTaskClick(task)}
                              >
                                {task.taskTitle}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      
                      {/* Evergreen tasks (tasks without release or with evergreen releaseId) */}
                      {Object.entries(tasksForDay)
                        .filter(([releaseId]) => releaseId === 'evergreen' || !releases.find(r => r.id === releaseId))
                        .map(([releaseId, { tasks }]) => (
                          <div key={releaseId} className="space-y-1">
                            <div className="text-xs font-medium px-2 py-1 rounded text-white bg-gray-500">
                              <i className="fas fa-calendar mr-1"></i>
                              Evergreen
                            </div>
                            {tasks.map(task => (
                              <div
                                key={task.id}
                                className="text-xs p-1 bg-gray-100 dark:bg-gray-600 rounded truncate cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors ml-2"
                                title={`${task.taskTitle} - Click to remove`}
                                onClick={() => handleTaskClick(task)}
                              >
                                {task.taskTitle}
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}