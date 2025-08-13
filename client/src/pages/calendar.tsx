import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTask, Release, ReleaseGroup } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle, Star, AlertTriangle, ExternalLink, ArrowLeft, Palette } from "lucide-react";
import { Link } from "wouter";

interface CalendarTask {
  id: string;
  taskTitle: string;
  taskDescription?: string | null;
  taskUrl?: string | null;
  assignedTo: string;
  releaseId: string;
  releaseName?: string;
  releaseGroup?: string;
  releaseColor?: string;
  releaseIcon?: string;
  priority: boolean | null;
  scheduledDate?: string | null;
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
  const [priorityCells, setPriorityCells] = useState<Set<string>>(new Set());
  const [editingReleaseAccent, setEditingReleaseAccent] = useState<string | null>(null);
  const [releaseAccentColors, setReleaseAccentColors] = useState<Map<string, string>>(new Map());
  const [showCustomDividerModal, setShowCustomDividerModal] = useState<{ day: number; month: number; year: number } | null>(null);
  const [customDividers, setCustomDividers] = useState<Map<string, Array<{ name: string; color: string; icon: string }>>>(new Map());
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedIcon, setSelectedIcon] = useState('fas fa-star');
  const [dividerName, setDividerName] = useState('');
  const [showSocialMediaModal, setShowSocialMediaModal] = useState<string | null>(null);
  const [taskSocialMedia, setTaskSocialMedia] = useState<Map<string, string[]>>(new Map());
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const queryClient = useQueryClient();

  // Fetch tasks data
  const { data: allTasks = [] } = useQuery<ChecklistTask[]>({
    queryKey: ["/api/checklist-tasks"]
  });

  // Fetch releases
  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["/api/releases"]
  });

  // Fetch release groups
  const { data: releaseGroups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"]
  });

  // Generate random accent colors for releases on mount
  useEffect(() => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#6B7280', '#EC4899'];
    const newAccentColors = new Map<string, string>();
    
    releases.forEach((release, index) => {
      if (!releaseAccentColors.has(release.id)) {
        newAccentColors.set(release.id, colors[index % colors.length]);
      }
    });
    
    if (newAccentColors.size > 0) {
      setReleaseAccentColors(prev => new Map([...prev, ...newAccentColors]));
    }
  }, [releases, releaseAccentColors]);

  // Schedule task mutation
  const scheduleTaskMutation = useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: string }) => {
      const response = await apiRequest(`/api/checklist-tasks/${taskId}/schedule`, 'PATCH', { scheduledDate: date });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  // Unschedule task mutation
  const unscheduleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest(`/api/checklist-tasks/${taskId}/unschedule`, 'PATCH');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days with empty cells for proper alignment
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Transform tasks for calendar use
  const tasks: CalendarTask[] = allTasks.map(task => ({
    id: task.id,
    taskTitle: task.taskTitle,
    taskDescription: task.taskDescription,
    taskUrl: task.taskUrl,
    assignedTo: task.assignedTo,
    releaseId: task.releaseId || 'evergreen',
    releaseName: releases.find(r => r.id === task.releaseId)?.name,
    releaseGroup: releases.find(r => r.id === task.releaseId) 
      ? releaseGroups.find(g => g.id === releases.find(r => r.id === task.releaseId)?.groupId)?.name 
      : undefined,
    releaseColor: releases.find(r => r.id === task.releaseId) 
      ? releaseGroups.find(g => g.id === releases.find(r => r.id === task.releaseId)?.groupId)?.color 
      : undefined,
    releaseIcon: releases.find(r => r.id === task.releaseId)?.icon,
    priority: task.priority,
    scheduledDate: task.scheduledDate
  }));

  // Separate tasks
  const scheduledTasks = tasks.filter(task => task.scheduledDate);
  const unscheduledTasks = tasks.filter(task => !task.scheduledDate);

  // Group unscheduled tasks by release
  const tasksByRelease = unscheduledTasks.reduce((acc, task) => {
    const releaseId = task.releaseId || 'evergreen';
    if (!acc[releaseId]) {
      acc[releaseId] = [];
    }
    acc[releaseId].push(task);
    return acc;
  }, {} as Record<string, CalendarTask[]>);

  const handleDragStart = (task: CalendarTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day?: number) => {
    e.preventDefault();
    if (draggedTask && day) {
      // Check if the task has a release and if the day is within the release date range
      const release = releases.find(r => r.id === draggedTask.releaseId);
      const targetDate = new Date(selectedYear, selectedMonth, day);
      
      if (release && draggedTask.releaseId !== 'evergreen') {
        const startDate = new Date(release.startDate);
        const endDate = new Date(release.endDate);
        
        if (targetDate < startDate || targetDate > endDate) {
          alert(`Cannot schedule task outside of release date range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
          setDraggedTask(null);
          return;
        }
      }
      
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      scheduleTaskMutation.mutate({ taskId: draggedTask.id, date: dateString });
      setDraggedTask(null);
    }
  };

  const handleTaskClick = (task: CalendarTask) => {
    if (task.scheduledDate) {
      unscheduleTaskMutation.mutate(task.id);
    }
  };

  // Get tasks for a specific day
  const getTasksForDay = (day: number) => {
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.scheduledDate) return false;
      const taskDate = new Date(task.scheduledDate);
      const checkDate = new Date(selectedYear, selectedMonth, day);
      return taskDate.toDateString() === checkDate.toDateString();
    });

    // Group by release
    const tasksByRelease: Record<string, { tasks: CalendarTask[] }> = {};
    
    dayTasks.forEach(task => {
      const releaseId = task.releaseId || 'evergreen';
      if (!tasksByRelease[releaseId]) {
        tasksByRelease[releaseId] = { tasks: [] };
      }
      tasksByRelease[releaseId].tasks.push(task);
    });

    return tasksByRelease;
  };

  // Get releases for a specific day
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
      <div className="flex h-screen">
        {/* Left Sidebar - Completed Tasks */}
        {sidebarVisible && (
          <div 
            className="w-1/6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedTask && draggedTask.scheduledDate) {
                unscheduleTaskMutation.mutate(draggedTask.id);
                setDraggedTask(null);
              }
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Completed Tasks
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarVisible(false)}
                  className="w-8 h-8 p-0"
                  title="Hide sidebar"
                >
                  <i className="fas fa-chevron-left text-sm"></i>
                </Button>
              </div>
              <div className="mb-6">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                  {unscheduledTasks.length} unscheduled
                </Badge>
              </div>

              <div className="space-y-3">
                {Object.entries(tasksByRelease).map(([releaseId, tasks]) => {
                  const release = releases.find(r => r.id === releaseId);
                  const group = release ? releaseGroups.find(g => g.id === release.groupId) : null;
                  
                  const groupColor = group?.color || '#6b7280';
                  const accentColor = release ? releaseAccentColors.get(release.id) || '#ffffff' : '#ffffff';
                  
                  return (
                    <div key={releaseId} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                      <div 
                        className="p-3 border-b border-gray-200 dark:border-gray-700 text-white relative"
                        style={{ 
                          backgroundColor: groupColor,
                          borderLeft: `4px solid ${accentColor}`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <i className={`${release?.icon || 'fas fa-calendar'} text-sm`}></i>
                            <span className="text-sm font-medium">
                              {release ? release.name : 'Evergreen'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
                              {tasks.length}
                            </span>
                            <button
                              className="w-4 h-4 rounded border border-gray-300 hover:scale-110 transition-transform bg-white flex items-center justify-center"
                              onClick={() => setEditingReleaseAccent(release?.id || releaseId)}
                            >
                              <i className="fas fa-wrench text-xs text-gray-600"></i>
                            </button>
                            {editingReleaseAccent === (release?.id || releaseId) && (
                              <div className="absolute mt-6 left-0 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border z-20">
                                <div className="flex space-x-2 mb-2">
                                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#6B7280', '#EC4899'].map(color => (
                                    <button
                                      key={color}
                                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      onClick={() => {
                                        const newAccentColors = new Map(releaseAccentColors);
                                        newAccentColors.set(release?.id || releaseId, color);
                                        setReleaseAccentColors(newAccentColors);
                                        setEditingReleaseAccent(null);
                                      }}
                                    />
                                  ))}
                                </div>
                                <input
                                  type="color"
                                  className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                                  value={releaseAccentColors.get(release?.id || releaseId) || '#3B82F6'}
                                  onChange={(e) => {
                                    const newAccentColors = new Map(releaseAccentColors);
                                    newAccentColors.set(release?.id || releaseId, e.target.value);
                                    setReleaseAccentColors(newAccentColors);
                                  }}
                                  onBlur={() => setEditingReleaseAccent(null)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-2 space-y-2">
                        {tasks.map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => handleDragStart(task)}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-h-[3rem] flex items-center"
                            title={task.taskTitle}
                          >
                            <div className="font-medium text-gray-900 dark:text-white leading-tight break-words">
                              {task.taskTitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
        )}

        {/* Right Side - Calendar */}
        <div className={`${sidebarVisible ? 'flex-1' : 'w-full'} overflow-y-auto`}>
          <div className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {!sidebarVisible && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarVisible(true)}
                    title="Show sidebar"
                  >
                    <i className="fas fa-chevron-right text-sm mr-2"></i>
                    Tasks
                  </Button>
                )}
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

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Day Labels */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-60"></div>;
                }

                const tasksForDay = getTasksForDay(day);
                const releasesForDay = getReleasesForDay(day);
                const currentDate = new Date();
                const isToday = 
                  day === currentDate.getDate() && 
                  selectedMonth === currentDate.getMonth() && 
                  selectedYear === currentDate.getFullYear();
                
                const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isHighPriority = priorityCells.has(dateKey);

                return (
                  <div
                    key={day}
                    className={`min-h-60 p-3 border-2 rounded-lg cursor-pointer transition-colors flex flex-col ${
                      isHighPriority 
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
                        : isToday 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    } hover:bg-gray-50 dark:hover:bg-gray-700`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="cell-header flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        isHighPriority 
                          ? 'text-red-600 dark:text-red-400' 
                          : isToday 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-white'
                      }`}>
                        {day}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCustomDividerModal({ day, month: selectedMonth, year: selectedYear });
                        }}
                      >
                        <i className="fas fa-plus text-xs"></i>
                      </Button>
                    </div>

                    {/* Custom dividers for this day */}
                    {customDividers.get(dateKey)?.map((divider, index) => (
                      <div 
                        key={index}
                        className="text-xs font-medium px-2 py-1 rounded text-white opacity-90 mb-1"
                        style={{ backgroundColor: divider.color }}
                      >
                        <i className={`${divider.icon} mr-1`}></i>
                        {divider.name}
                      </div>
                    ))}

                    {/* Release dividers for active releases */}
                    <div className="space-y-2">
                      {releasesForDay.map(release => {
                        const group = releaseGroups.find(g => g.id === release.groupId);
                        const releaseTasks = tasksForDay[release.id]?.tasks || [];
                        
                        return (
                          <div key={release.id} className="space-y-1">
                            {/* Release divider box */}
                            <div 
                              className="text-xs font-medium px-2 py-2 rounded text-white opacity-90 border-l-4"
                              style={{ 
                                backgroundColor: group?.color || '#6b7280',
                                borderLeftColor: release ? releaseAccentColors.get(release.id) || 'transparent' : 'transparent'
                              }}
                            >
                              <i className={`${release.icon} mr-1`}></i>
                              {release.name}
                            </div>
                            
                            {/* Tasks under this release */}
                            {releaseTasks.map(task => (
                              <div
                                key={task.id}
                                draggable
                                className="text-xs p-2 bg-gray-100 dark:bg-gray-600 rounded cursor-move hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors ml-2 min-h-[2.5rem] flex flex-col space-y-1"
                                title={`${task.taskTitle} - Drag to move or click to remove`}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setDraggedTask(task);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(task);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="break-words flex-1">{task.taskTitle}</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-4 h-4 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowSocialMediaModal(task.id);
                                    }}
                                  >
                                    <i className="fas fa-plus text-xs"></i>
                                  </Button>
                                </div>
                                {/* Social Media Icons */}
                                {taskSocialMedia.get(task.id) && (
                                  <div className="flex space-x-1 mt-1">
                                    {taskSocialMedia.get(task.id)?.map((platform, index) => {
                                      const colors = {
                                        'X': '#000000',
                                        'LinkedIn': '#0077B5', 
                                        'Youtube': '#FF0000',
                                        'Instagram': '#8A3AB9',
                                        'TikTok': '#FF0050',
                                        'Facebook': '#1877F2',
                                        'Reddit': '#FF4500'
                                      };
                                      return (
                                        <div 
                                          key={index} 
                                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                          style={{ backgroundColor: colors[platform as keyof typeof colors] }}
                                        >
                                          {platform === 'X' ? '𝕏' : 
                                           platform === 'LinkedIn' ? 'in' :
                                           platform === 'Youtube' ? '▶' :
                                           platform === 'Instagram' ? '📷' :
                                           platform === 'TikTok' ? '♪' :
                                           platform === 'Facebook' ? 'f' :
                                           platform === 'Reddit' ? 'r' : platform[0]}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      
                      {/* Evergreen tasks */}
                      {Object.entries(tasksForDay)
                        .filter(([releaseId]) => releaseId === 'evergreen' || !releases.find(r => r.id === releaseId))
                        .map(([releaseId, { tasks }]) => (
                          <div key={releaseId} className="space-y-1">
                            <div className="text-xs font-medium px-2 py-2 rounded text-white bg-gray-500 opacity-90">
                              <i className="fas fa-calendar mr-1"></i>
                              Evergreen
                            </div>
                            {tasks.map(task => (
                              <div
                                key={task.id}
                                className="text-xs p-2 bg-gray-100 dark:bg-gray-600 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors ml-2 min-h-[2.5rem] flex flex-col space-y-1"
                                title={`${task.taskTitle} - Click to remove`}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedTask(task);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => setDraggedTask(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskClick(task);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="break-words flex-1">{task.taskTitle}</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-4 h-4 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowSocialMediaModal(task.id);
                                    }}
                                  >
                                    <i className="fas fa-plus text-xs"></i>
                                  </Button>
                                </div>
                                {/* Social Media Icons */}
                                {taskSocialMedia.get(task.id) && (
                                  <div className="flex space-x-1 mt-1">
                                    {taskSocialMedia.get(task.id)?.map((platform, index) => {
                                      const colors = {
                                        'X': '#000000',
                                        'LinkedIn': '#0077B5', 
                                        'Youtube': '#FF0000',
                                        'Instagram': '#8A3AB9',
                                        'TikTok': '#FF0050',
                                        'Facebook': '#1877F2',
                                        'Reddit': '#FF4500'
                                      };
                                      return (
                                        <div 
                                          key={index} 
                                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                          style={{ backgroundColor: colors[platform as keyof typeof colors] }}
                                        >
                                          {platform === 'X' ? '𝕏' : 
                                           platform === 'LinkedIn' ? 'in' :
                                           platform === 'Youtube' ? '▶' :
                                           platform === 'Instagram' ? '📷' :
                                           platform === 'TikTok' ? '♪' :
                                           platform === 'Facebook' ? 'f' :
                                           platform === 'Reddit' ? 'r' : platform[0]}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>

                    {/* Status text at bottom of cell */}
                    <div className="mt-auto pt-2">
                      {isHighPriority && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium text-center">
                          HIGH PRIORITY
                        </div>
                      )}
                      {isToday && !isHighPriority && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center">
                          CURRENT DAY
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Divider Modal */}
      {showCustomDividerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Custom Divider
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={dividerName}
                  onChange={(e) => setDividerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Enter divider name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex space-x-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#6B7280', '#EC4899'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                        selectedColor === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {['fas fa-star', 'fas fa-flag', 'fas fa-bell', 'fas fa-heart', 'fas fa-check', 'fas fa-exclamation'].map(icon => (
                    <button
                      key={icon}
                      className={`w-8 h-8 border-2 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedIcon === icon 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      onClick={() => setSelectedIcon(icon)}
                    >
                      <i className={`${icon} text-gray-600 dark:text-gray-400`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    High Priority
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (showCustomDividerModal) {
                        const { day, month, year } = showCustomDividerModal;
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const newPriorityCells = new Set(priorityCells);
                        if (newPriorityCells.has(dateKey)) {
                          newPriorityCells.delete(dateKey);
                        } else {
                          newPriorityCells.add(dateKey);
                        }
                        setPriorityCells(newPriorityCells);
                      }
                    }}
                    className={
                      showCustomDividerModal && priorityCells.has(`${showCustomDividerModal.year}-${String(showCustomDividerModal.month + 1).padStart(2, '0')}-${String(showCustomDividerModal.day).padStart(2, '0')}`)
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : ''
                    }
                  >
                    {showCustomDividerModal && priorityCells.has(`${showCustomDividerModal.year}-${String(showCustomDividerModal.month + 1).padStart(2, '0')}-${String(showCustomDividerModal.day).padStart(2, '0')}`) 
                      ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCustomDividerModal(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showCustomDividerModal) {
                    const { day, month, year } = showCustomDividerModal;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    // Only add divider if name is provided
                    if (dividerName.trim()) {
                      const newDividers = new Map(customDividers);
                      const existingDividers = newDividers.get(dateKey) || [];
                      existingDividers.push({
                        name: dividerName.trim(),
                        color: selectedColor,
                        icon: selectedIcon
                      });
                      newDividers.set(dateKey, existingDividers);
                      setCustomDividers(newDividers);
                    }
                    
                    // Reset form and close modal
                    setDividerName('');
                    setSelectedColor('#3B82F6');
                    setSelectedIcon('fas fa-star');
                    setShowCustomDividerModal(null);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media Selection Modal */}
      {showSocialMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Social Media Platforms
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {['X', 'LinkedIn', 'Youtube', 'Instagram', 'TikTok', 'Facebook', 'Reddit'].map(platform => {
                const isSelected = taskSocialMedia.get(showSocialMediaModal)?.includes(platform) || false;
                return (
                  <button
                    key={platform}
                    className={`p-3 rounded border-2 transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      const currentPlatforms = taskSocialMedia.get(showSocialMediaModal) || [];
                      const newTaskSocialMedia = new Map(taskSocialMedia);
                      
                      if (isSelected) {
                        // Remove platform
                        const updatedPlatforms = currentPlatforms.filter(p => p !== platform);
                        if (updatedPlatforms.length === 0) {
                          newTaskSocialMedia.delete(showSocialMediaModal);
                        } else {
                          newTaskSocialMedia.set(showSocialMediaModal, updatedPlatforms);
                        }
                      } else {
                        // Add platform
                        newTaskSocialMedia.set(showSocialMediaModal, [...currentPlatforms, platform]);
                      }
                      
                      setTaskSocialMedia(newTaskSocialMedia);
                    }}
                  >
                    <div className="text-sm font-medium">{platform}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSocialMediaModal(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowSocialMediaModal(null)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}