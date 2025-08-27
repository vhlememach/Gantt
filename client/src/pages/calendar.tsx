import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTask, Release, ReleaseGroup, EvergreenBox } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle, Star, AlertTriangle, ExternalLink, ArrowLeft, Palette } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaReddit } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  completed: boolean;
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

// Social Media Icon Helper Component
const SocialMediaIcon = ({ platform }: { platform: string }) => {
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
      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: colors[platform as keyof typeof colors] }}
    >
      {platform === 'X' ? <FaXTwitter className="w-3 h-3" /> : 
       platform === 'LinkedIn' ? <FaLinkedin className="w-3 h-3" /> :
       platform === 'Youtube' ? <FaYoutube className="w-3 h-3" /> :
       platform === 'Instagram' ? <FaInstagram className="w-3 h-3" /> :
       platform === 'TikTok' ? <FaTiktok className="w-3 h-3" /> :
       platform === 'Facebook' ? <FaFacebook className="w-3 h-3" /> :
       platform === 'Reddit' ? <FaReddit className="w-3 h-3" /> : platform[0]}
    </div>
  );
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
  const [customDividers, setCustomDividers] = useState<Map<string, Array<{ id?: string; name: string; color: string; icon: string; mediaLink?: string; textLink?: string; releaseId?: string | null; evergreenBoxId?: string | null; assignedMembers?: string[]; completed?: boolean }>>>(new Map());
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedIcon, setSelectedIcon] = useState('fas fa-star');
  const [dividerName, setDividerName] = useState('');
  const [dividerMediaLink, setDividerMediaLink] = useState('');
  const [dividerTextLink, setDividerTextLink] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEvergreenBoxId, setSelectedEvergreenBoxId] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{dateKey: string; index: number; divider: any} | null>(null);
  const [showSocialMediaModal, setShowSocialMediaModal] = useState<string | null>(null);
  const [taskSocialMedia, setTaskSocialMedia] = useState<Map<string, string[]>>(new Map());
  const [taskSocialMediaUrls, setTaskSocialMediaUrls] = useState<Map<string, string>>(new Map());
  const [taskSocialMediaTimes, setTaskSocialMediaTimes] = useState<Map<string, string>>(new Map());
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [editingDivider, setEditingDivider] = useState<{dateKey: string, index: number, divider: any} | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const teamMembers = ["Brian", "Alex", "Lucas", "Victor"];

  // Fetch custom dividers from database
  const { data: customDividersData = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-dividers"]
  });

  // Load custom dividers into state when data changes
  useEffect(() => {
    const dividersMap = new Map<string, any[]>();
    customDividersData.forEach((divider) => {
      const existing = dividersMap.get(divider.dateKey) || [];
      existing.push({
        id: divider.id,
        name: divider.name,
        color: divider.color,
        icon: divider.icon,
        mediaLink: divider.mediaLink,
        textLink: divider.textLink,
        releaseId: divider.releaseId,
        evergreenBoxId: divider.evergreenBoxId,
        assignedMembers: divider.assignedMembers || [],
        completed: divider.completed || false
      });
      dividersMap.set(divider.dateKey, existing);
    });
    setCustomDividers(dividersMap);
  }, [customDividersData]);

  // Mutation for creating/updating custom dividers
  const saveCustomDividerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/custom-dividers', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-dividers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  const updateCustomDividerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/custom-dividers/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-dividers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  const deleteCustomDividerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/custom-dividers/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-dividers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    }
  });

  // Fetch all task social media data
  const { data: allTaskSocialMedia = [] } = useQuery({
    queryKey: ['/api/task-social-media'],
    enabled: true
  });

  // Load priority cells from localStorage on mount
  useEffect(() => {
    try {
      const savedPriorityCells = localStorage.getItem('calendar-priority-cells');
      if (savedPriorityCells) {
        const parsedCells = JSON.parse(savedPriorityCells);
        setPriorityCells(new Set(parsedCells));
      }
    } catch (error) {
      console.error('Error loading priority cells from localStorage:', error);
    }
  }, []);

  // Save priority cells to localStorage whenever they change
  useEffect(() => {
    try {
      const cellsArray = Array.from(priorityCells);
      localStorage.setItem('calendar-priority-cells', JSON.stringify(cellsArray));
    } catch (error) {
      console.error('Error saving priority cells to localStorage:', error);
    }
  }, [priorityCells]);

  // Load social media data into state - prevent infinite loops
  useEffect(() => {
    if (!allTaskSocialMedia || (allTaskSocialMedia as any[]).length === 0) return;
    
    const socialMediaMap = new Map<string, string[]>();
    const socialMediaUrlMap = new Map<string, string>();
    (allTaskSocialMedia as any[]).forEach((sm: any) => {
      if (sm?.taskId && sm?.platforms) {
        socialMediaMap.set(sm.taskId, sm.platforms);
        if (sm.linkUrl) {
          socialMediaUrlMap.set(sm.taskId, sm.linkUrl);
        }
      }
    });
    
    // Only update if data has actually changed
    const currentKeys = Array.from(taskSocialMedia.keys()).sort();
    const newKeys = Array.from(socialMediaMap.keys()).sort();
    const hasChanged = currentKeys.length !== newKeys.length || 
                      currentKeys.some((key, i) => key !== newKeys[i]);
    
    if (hasChanged) {
      setTaskSocialMedia(socialMediaMap);
      setTaskSocialMediaUrls(socialMediaUrlMap);
    }
  }, [allTaskSocialMedia]);

  // Social media mutation for saving platforms and URLs
  const saveTaskSocialMediaMutation = useMutation({
    mutationFn: async ({ taskId, platforms, linkUrl }: { taskId: string; platforms: string[]; linkUrl?: string }) => {
      const response = await apiRequest('POST', '/api/task-social-media', { taskId, platforms, linkUrl });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-social-media'] });
    },
    onError: (error) => {
      console.error('Save social media mutation error:', error);
    }
  });

  // Fetch tasks data - use only main endpoint to avoid duplicates
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

  // Fetch evergreen boxes to check for task generation
  const { data: evergreenBoxes = [] } = useQuery<EvergreenBox[]>({
    queryKey: ["/api/evergreen-boxes"]
  });

  // Load release accent colors from localStorage on mount
  useEffect(() => {
    try {
      const savedColors = localStorage.getItem('calendar-release-accent-colors');
      if (savedColors) {
        const parsedColors = JSON.parse(savedColors);
        const colorsMap = new Map(Object.entries(parsedColors) as [string, string][]);
        setReleaseAccentColors(colorsMap);
      }
    } catch (error) {
      console.error('Error loading release accent colors from localStorage:', error);
    }
  }, []);

  // Save release accent colors to localStorage whenever they change
  useEffect(() => {
    try {
      const colorsObject = Object.fromEntries(releaseAccentColors);
      localStorage.setItem('calendar-release-accent-colors', JSON.stringify(colorsObject));
    } catch (error) {
      console.error('Error saving release accent colors to localStorage:', error);
    }
  }, [releaseAccentColors]);

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
      setReleaseAccentColors(prev => {
        const updated = new Map(prev);
        newAccentColors.forEach((value, key) => {
          updated.set(key, value);
        });
        return updated;
      });
    }
  }, [releases, releaseAccentColors]);

  // Check if we need to generate evergreen tasks on calendar page load
  useEffect(() => {
    const evergreenTasks = allTasks.filter(task => task.evergreenBoxId);
    const boxesWithCycles = evergreenBoxes.filter((box: any) => box.waterfallCycleId);
    
    // If we have evergreen boxes with cycles but no evergreen tasks, generate them
    if (boxesWithCycles.length > 0 && evergreenTasks.length === 0) {
      console.log("No evergreen tasks found on calendar, generating them...");
      fetch("/api/evergreen-tasks/generate", { method: "POST" })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
        })
        .catch(console.error);
    }
  }, [allTasks, evergreenBoxes, queryClient]);

  // Schedule task mutation
  const scheduleTaskMutation = useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: string }) => {
      console.log('Making API request to schedule task:', taskId, 'on date:', date);
      const response = await apiRequest('PATCH', `/api/checklist-tasks/${taskId}/schedule`, { scheduledDate: date });
      return await response.json();
    },
    onSuccess: () => {
      console.log('Task scheduled successfully, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      setDraggedTask(null);
    },
    onError: (error) => {
      console.error('Schedule task mutation error:', error);
      setDraggedTask(null);
    }
  });

  // Unschedule task mutation
  const unscheduleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      console.log('Making API request to unschedule task:', taskId);
      const response = await apiRequest('PATCH', `/api/checklist-tasks/${taskId}/unschedule`, {});
      return await response.json();
    },
    onSuccess: () => {
      console.log('Task unscheduled successfully, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
    },
    onError: (error) => {
      console.error('Unschedule task mutation error:', error);
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

  // Create a mapping of custom dividers to their task statuses
  const dividerTaskStatuses = useMemo(() => {
    const statusMap = new Map<string, { paused: boolean; underReview: boolean }>();
    
    allTasks.forEach(task => {
      if (task.customDividerId) {
        const existing = statusMap.get(task.customDividerId) || { paused: false, underReview: false };
        statusMap.set(task.customDividerId, {
          paused: existing.paused || task.paused || false,
          underReview: existing.underReview || task.reviewStatus === 'requested'
        });
      }
    });
    
    return statusMap;
  }, [allTasks]);

  // Use useMemo to prevent re-computation and ensure stable task grouping
  const { tasks, scheduledTasks, unscheduledTasks, tasksByRelease } = useMemo(() => {
    console.log('Processing tasks - Raw count:', allTasks.length);
    
    // Deduplicate tasks by ID first
    const uniqueTasksMap = new Map<string, ChecklistTask>();
    allTasks.forEach(task => {
      uniqueTasksMap.set(task.id, task);
    });
    const deduplicatedTasks = Array.from(uniqueTasksMap.values());
    console.log('After deduplication:', deduplicatedTasks.length);
    
    // Transform tasks - include completion status
    const processedTasks: CalendarTask[] = deduplicatedTasks.map(task => ({
      id: task.id,
      taskTitle: task.evergreenBoxId ? `${task.assignedTo} > ${task.taskTitle}` : task.taskTitle,
      taskDescription: task.taskDescription,
      taskUrl: task.taskUrl,
      assignedTo: task.assignedTo,
      releaseId: task.releaseId || (task.evergreenBoxId ? 'evergreen' : 'general'),
      releaseName: releases.find(r => r.id === task.releaseId)?.name,
      releaseGroup: releases.find(r => r.id === task.releaseId) 
        ? releaseGroups.find(g => g.id === releases.find(r => r.id === task.releaseId)?.groupId)?.name 
        : undefined,
      releaseColor: releases.find(r => r.id === task.releaseId) 
        ? releaseGroups.find(g => g.id === releases.find(r => r.id === task.releaseId)?.groupId)?.color 
        : undefined,
      releaseIcon: releases.find(r => r.id === task.releaseId)?.icon,
      priority: task.priority,
      scheduledDate: task.scheduledDate,
      completed: task.completed || false // Add completion status, handle null
    }));
    
    // Only show scheduled tasks that are actually completed in Team Checklist
    const scheduled = processedTasks.filter(task => {
      if (!task.scheduledDate) return false;
      // Find the current completion status from the original task data
      const originalTask = deduplicatedTasks.find(t => t.id === task.id);
      const isCompleted = originalTask?.completed === true;
      if (task.scheduledDate) {
        console.log(`Task "${task.taskTitle}" (${task.id}): scheduled=${!!task.scheduledDate}, completed=${isCompleted}, originalCompleted=${originalTask?.completed}`);
      }
      return isCompleted;
    });
    const unscheduled = processedTasks.filter(task => !task.scheduledDate);
    console.log('Scheduled:', scheduled.length, 'Unscheduled:', unscheduled.length);

    // Group COMPLETED unscheduled tasks by release with strict deduplication
    // The sidebar should ONLY show tasks that are completed in Team Checklist AND unscheduled
    const completedUnscheduledTasks = unscheduled.filter(task => {
      const originalTask = deduplicatedTasks.find(t => t.id === task.id);
      return originalTask?.completed === true;
    });
    
    const groupedTasks = completedUnscheduledTasks.reduce((acc, task) => {
      const releaseId = task.releaseId || 'evergreen';
      if (!acc[releaseId]) {
        acc[releaseId] = { tasks: [], seenIds: new Set<string>() };
      }
      
      // Only add if not already seen
      if (!acc[releaseId].seenIds.has(task.id)) {
        acc[releaseId].tasks.push(task);
        acc[releaseId].seenIds.add(task.id);
      }
      
      return acc;
    }, {} as Record<string, { tasks: CalendarTask[], seenIds: Set<string> }>);

    // Clean up the structure for return
    const cleanGroupedTasks: Record<string, { tasks: CalendarTask[] }> = {};
    Object.entries(groupedTasks).forEach(([releaseId, data]) => {
      cleanGroupedTasks[releaseId] = { tasks: data.tasks };
      console.log(`Release ${releaseId}: ${data.tasks.length} unique tasks`);
    });

    return {
      tasks: processedTasks,
      scheduledTasks: scheduled,
      unscheduledTasks: unscheduled,
      tasksByRelease: cleanGroupedTasks
    };
  }, [allTasks, releases, releaseGroups]);

  const handleDragStart = (task: CalendarTask) => {
    console.log('Drag started for task:', task.taskTitle);
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, day?: number) => {
    e.preventDefault();
    console.log('Drop event on day:', day, 'draggedTask:', draggedTask?.taskTitle);
    
    if (draggedTask && day) {
      // Check if the task has a release and if the day is within the release date range
      const release = releases.find(r => r.id === draggedTask.releaseId);
      const targetDate = new Date(selectedYear, selectedMonth, day);
      
      if (release && draggedTask.releaseId !== 'evergreen') {
        const startDate = new Date(release.startDate);
        const endDate = new Date(release.endDate);
        
        if (targetDate < startDate || targetDate > endDate) {
          toast({
            title: "Invalid Date",
            description: `Cannot schedule task outside of release date range (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
            variant: "destructive",
          });
          setDraggedTask(null);
          return;
        }
      }
      
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log('Scheduling task to:', dateString);
      
      scheduleTaskMutation.mutate({ taskId: draggedTask.id, date: dateString });
    }
  };

  const handleTaskClick = (task: CalendarTask, action: 'view' | 'remove' = 'view') => {
    if (action === 'remove' && task.scheduledDate) {
      unscheduleTaskMutation.mutate(task.id);
    } else if (action === 'view') {
      // For now, just open task URL if available
      if (task.taskUrl) {
        window.open(task.taskUrl, '_blank');
      }
    }
  };

  // Get tasks for a specific day - only show tasks that are both scheduled AND currently completed
  const getTasksForDay = (day: number) => {
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Get all tasks that have a scheduled date for this day
    const dayTasks = tasks.filter(task => {
      if (!task.scheduledDate) return false;
      const taskDate = new Date(task.scheduledDate);
      const checkDate = new Date(selectedYear, selectedMonth, day);
      const isSameDay = taskDate.toDateString() === checkDate.toDateString();
      
      if (isSameDay) {
        // Double-check completion status from original task data
        const originalTask = allTasks.find(t => t.id === task.id);
        const isCurrentlyCompleted = originalTask?.completed === true;
        console.log(`Task "${task.taskTitle}" for day ${day}: completed=${isCurrentlyCompleted}, originalCompleted=${originalTask?.completed}`);
        return isCurrentlyCompleted;
      }
      
      return false;
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
              }
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Available Tasks
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
                  {Object.values(tasksByRelease).reduce((total, release) => total + release.tasks.length, 0)} completed & unscheduled
                </Badge>
              </div>

              <div className="space-y-3">
                {Object.entries(tasksByRelease).map(([releaseId, releaseData]) => {
                  if (!releaseData?.tasks?.length) {
                    return null;
                  }
                  
                  const taskList = releaseData.tasks;
                  const release = releases.find(r => r.id === releaseId);
                  
                  // Verify no duplicates exist
                  const titleCounts = taskList.reduce((acc, task) => {
                    acc[task.taskTitle] = (acc[task.taskTitle] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const duplicates = Object.entries(titleCounts).filter(([title, count]) => count > 1);
                  if (duplicates.length > 0) {
                    console.error(`❌ DUPLICATES FOUND in release ${release?.name || releaseId}:`, duplicates);
                  } else {
                    console.log(`✅ No duplicates in release ${release?.name || releaseId} (${taskList.length} unique tasks)`);
                  }
                  const group = release ? releaseGroups.find(g => g.id === release.groupId) : null;
                  
                  // Define accent colors for special groups
                  let accentColor = '#6B7280'; // Default gray
                  if (releaseId === 'evergreen') {
                    accentColor = '#10B981'; // Green for evergreen
                  } else if (releaseId === 'general') {
                    // Don't show general tasks in calendar
                    return null;
                  } else if (group) {
                    accentColor = group.color || '#6B7280';
                  }
                  
                  const groupColor = group?.color || '#6b7280';
                  
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
                              {release ? release.name : (releaseId === 'evergreen' ? 'Evergreen' : 'General Tasks')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
                              {taskList.length}
                            </span>
                            <button
                              className="w-4 h-4 rounded border border-gray-300 hover:scale-110 transition-transform bg-white flex items-center justify-center"
                              onClick={() => setEditingReleaseAccent(release?.id || releaseId)}
                            >
                              <i className="fas fa-wrench text-xs text-gray-600"></i>
                            </button>
                            {editingReleaseAccent === (release?.id || releaseId) && (
                              <>
                                <div 
                                  className="fixed inset-0 bg-black bg-opacity-50 z-40"
                                  onClick={() => setEditingReleaseAccent(null)}
                                />
                                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-4 rounded shadow-lg border z-50 min-w-[250px]">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Choose Accent Color</h3>
                                    <button
                                      className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                                      onClick={() => setEditingReleaseAccent(null)}
                                    >
                                      <i className="fas fa-times text-xs text-gray-600"></i>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 mb-3">
                                    {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#6B7280', '#EC4899'].map(color => (
                                      <button
                                        key={color}
                                        className={`w-10 h-10 rounded border-2 hover:scale-110 transition-transform ${
                                          releaseAccentColors.get(release?.id || releaseId) === color 
                                            ? 'border-gray-800 dark:border-white' 
                                            : 'border-gray-300'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          const newAccentColors = new Map(releaseAccentColors);
                                          const currentReleaseId = release?.id || releaseId;
                                          newAccentColors.set(currentReleaseId, color);
                                          setReleaseAccentColors(newAccentColors);
                                          setEditingReleaseAccent(null);
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center space-x-2 border-t pt-3">
                                    <button
                                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform bg-white flex items-center justify-center"
                                      onClick={() => {
                                        const colorInput = document.createElement('input');
                                        colorInput.type = 'color';
                                        colorInput.value = releaseAccentColors.get(release?.id || releaseId) || '#3B82F6';
                                        colorInput.onchange = (e) => {
                                          const newAccentColors = new Map(releaseAccentColors);
                                          newAccentColors.set(release?.id || releaseId, (e.target as HTMLInputElement).value);
                                          setReleaseAccentColors(newAccentColors);
                                          setEditingReleaseAccent(null);
                                        };
                                        colorInput.click();
                                      }}
                                    >
                                      <i className="fas fa-paint-brush text-xs text-gray-600"></i>
                                    </button>
                                    <span className="text-xs text-gray-600 dark:text-gray-300">Custom Color</span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-2 space-y-2">
                        {taskList.map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              console.log('onDragStart called for:', task.taskTitle);
                              handleDragStart(task);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={(e) => {
                              console.log('onDragEnd called');
                              setDraggedTask(null);
                            }}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-h-[3rem] flex items-center"
                            title={`Drag to schedule: ${task.taskTitle}`}
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
                    className={`min-h-60 p-3 border-2 transition-colors flex flex-col ${
                      isHighPriority 
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
                        : isToday 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    } ${draggedTask ? 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(e);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      
                      // Handle divider drops
                      const dividerData = e.dataTransfer.getData('divider');
                      if (dividerData) {
                        try {
                          const { divider, sourceDate, index } = JSON.parse(dividerData);
                          const targetDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          
                          // Only move if different dates
                          if (sourceDate !== targetDate) {
                            // Remove from source
                            const newDividers = new Map(customDividers);
                            const sourceDividers = newDividers.get(sourceDate) || [];
                            sourceDividers.splice(index, 1);
                            if (sourceDividers.length === 0) {
                              newDividers.delete(sourceDate);
                            } else {
                              newDividers.set(sourceDate, sourceDividers);
                            }
                            
                            // Add to target
                            const targetDividers = newDividers.get(targetDate) || [];
                            targetDividers.push(divider);
                            newDividers.set(targetDate, targetDividers);
                            
                            setCustomDividers(newDividers);
                            toast({ title: "Divider moved successfully" });
                          }
                        } catch (error) {
                          console.error('Error moving divider:', error);
                        }
                        return;
                      }
                      
                      // Handle task drops
                      handleDrop(e, day);
                    }}
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

                    {/* Custom dividers with no project assignment */}
                    {customDividers.get(dateKey)
                      ?.filter(divider => !divider.releaseId)
                      ?.map((divider, index) => {
                        const originalIndex = customDividers.get(dateKey)?.findIndex(d => d === divider) || 0;
                        return (
                          <div 
                            key={originalIndex}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('divider', JSON.stringify({
                                divider,
                                sourceDate: dateKey,
                                index: originalIndex
                              }));
                            }}
                            className="text-xs font-medium px-2 py-1 rounded opacity-90 mb-1 flex items-center justify-between group cursor-move hover:opacity-100 transition-opacity border-2"
                            style={{ 
                              backgroundColor: divider.color,
                              color: 'white',
                              borderColor: divider.color
                            }}
                          >
                            <div className="flex flex-col">
                              {divider.completed && (
                                <div className="flex items-center justify-center mb-1 bg-black bg-opacity-70 rounded px-2 py-1">
                                  <i className="fas fa-check-circle text-green-400 text-sm mr-1"></i>
                                  <span className="text-xs text-green-400">Completed</span>
                                </div>
                              )}
                              {dividerTaskStatuses.get(divider.id)?.paused && (
                                <div className="flex items-center justify-center mb-1 bg-black bg-opacity-70 rounded px-2 py-1">
                                  <i className="fas fa-pause-circle text-orange-400 text-sm mr-1"></i>
                                  <span className="text-xs text-orange-400">Paused</span>
                                </div>
                              )}
                              {dividerTaskStatuses.get(divider.id)?.underReview && (
                                <div className="flex items-center justify-center mb-1 bg-black bg-opacity-70 rounded px-2 py-1">
                                  <i className="fas fa-eye text-blue-400 text-sm mr-1"></i>
                                  <span className="text-xs text-blue-400">Under Review</span>
                                </div>
                              )}
                              <div className="flex items-center mb-1">
                                <i className={`${divider.icon} mr-1`}></i>
                                {divider.name}
                              </div>
                              {(divider.mediaLink || divider.textLink) && (
                                <div className="flex flex-col space-y-1">
                                  {divider.mediaLink && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (divider.mediaLink) {
                                          const url = divider.mediaLink.startsWith('http://') || divider.mediaLink.startsWith('https://') 
                                            ? divider.mediaLink 
                                            : `https://${divider.mediaLink}`;
                                          window.open(url, '_blank');
                                        }
                                      }}
                                      className="text-xs underline hover:no-underline opacity-80 hover:opacity-100 flex items-center"
                                      title="Open Media Link"
                                    >
                                      <i className="fas fa-image mr-1"></i>
                                      Media
                                    </button>
                                  )}
                                  {divider.textLink && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (divider.textLink) {
                                          const url = divider.textLink.startsWith('http://') || divider.textLink.startsWith('https://') 
                                            ? divider.textLink 
                                            : `https://${divider.textLink}`;
                                          window.open(url, '_blank');
                                        }
                                      }}
                                      className="text-xs underline hover:no-underline opacity-80 hover:opacity-100 flex items-center"
                                      title="Open Text Link"
                                    >
                                      <i className="fas fa-link mr-1"></i>
                                      Text
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="w-4 h-4 rounded border border-white/30 hover:bg-white/20 flex items-center justify-center mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDivider({ dateKey, index: originalIndex, divider });
                                }}
                                title="Edit divider"
                              >
                                <i className="fas fa-edit text-xs"></i>
                              </button>
                              <button
                                className="w-4 h-4 rounded border border-white/30 hover:bg-white/20 flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmModal({ dateKey, index: originalIndex, divider });
                                }}
                                title="Delete divider"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}

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
                            
                            {/* Custom dividers assigned to this project */}
                            {customDividers.get(dateKey)
                              ?.filter(divider => divider.releaseId === release.id)
                              ?.map((divider, index) => {
                                const originalIndex = customDividers.get(dateKey)?.findIndex(d => d === divider) || 0;
                                return (
                                  <div 
                                    key={`divider-${originalIndex}`}
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('divider', JSON.stringify({
                                        divider,
                                        sourceDate: dateKey,
                                        index: originalIndex
                                      }));
                                    }}
                                    className="text-xs font-medium px-2 py-1 rounded opacity-90 mb-1 flex items-center justify-between group cursor-move hover:opacity-100 transition-colors ml-2 border-2"
                                    style={{ 
                                      backgroundColor: 'white',
                                      color: group?.color || '#6b7280',
                                      borderColor: group?.color || '#6b7280'
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      {divider.completed && (
                                        <div className="flex items-center justify-center mb-1 bg-black bg-opacity-70 rounded px-2 py-1">
                                          <i className="fas fa-check-circle text-green-400 text-sm mr-1"></i>
                                          <span className="text-xs text-green-400">Completed</span>
                                        </div>
                                      )}
                                      {dividerTaskStatuses.get(divider.id)?.paused && (
                                        <div className="flex items-center justify-center mb-1 bg-black bg-opacity-70 rounded px-2 py-1">
                                          <i className="fas fa-pause-circle text-orange-400 text-sm mr-1"></i>
                                          <span className="text-xs text-orange-400">Paused</span>
                                        </div>
                                      )}
                                      {dividerTaskStatuses.get(divider.id)?.underReview && (
                                        <div className="flex items-center justify-center mb-1 bg-black bg-opacity-70 rounded px-2 py-1">
                                          <i className="fas fa-eye text-blue-400 text-sm mr-1"></i>
                                          <span className="text-xs text-blue-400">Under Review</span>
                                        </div>
                                      )}
                                      <div className="flex items-center mb-1">
                                        <i className={`${divider.icon} mr-1`}></i>
                                        {divider.name}
                                      </div>
                                      {(divider.mediaLink || divider.textLink) && (
                                        <div className="flex flex-col space-y-1">
                                          {divider.mediaLink && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (divider.mediaLink) {
                                                  const url = divider.mediaLink.startsWith('http://') || divider.mediaLink.startsWith('https://') 
                                                    ? divider.mediaLink 
                                                    : `https://${divider.mediaLink}`;
                                                  window.open(url, '_blank');
                                                }
                                              }}
                                              className="text-xs underline hover:no-underline opacity-80 hover:opacity-100 flex items-center"
                                              title="Open Media Link"
                                              style={{ color: group?.color || '#6b7280' }}
                                            >
                                              <i className="fas fa-image mr-1"></i>
                                              Media
                                            </button>
                                          )}
                                          {divider.textLink && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (divider.textLink) {
                                                  const url = divider.textLink.startsWith('http://') || divider.textLink.startsWith('https://') 
                                                    ? divider.textLink 
                                                    : `https://${divider.textLink}`;
                                                  window.open(url, '_blank');
                                                }
                                              }}
                                              className="text-xs underline hover:no-underline opacity-80 hover:opacity-100 flex items-center"
                                              title="Open Text Link"
                                              style={{ color: group?.color || '#6b7280' }}
                                            >
                                              <i className="fas fa-link mr-1"></i>
                                              Text
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        className="w-4 h-4 rounded border hover:bg-gray-100 flex items-center justify-center mr-1"
                                        style={{ borderColor: group?.color || '#6b7280' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingDivider({ dateKey, index: originalIndex, divider });
                                        }}
                                        title="Edit divider"
                                      >
                                        <i className="fas fa-edit text-xs" style={{ color: group?.color || '#6b7280' }}></i>
                                      </button>
                                      <button
                                        className="w-4 h-4 rounded border hover:bg-gray-100 flex items-center justify-center"
                                        style={{ borderColor: group?.color || '#6b7280' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmModal({ dateKey, index: originalIndex, divider });
                                        }}
                                        title="Delete divider"
                                      >
                                        <i className="fas fa-times text-xs" style={{ color: group?.color || '#6b7280' }}></i>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            
                            {/* Tasks under this release */}
                            {releaseTasks.map(task => (
                              <div
                                key={task.id}
                                draggable
                                className="text-xs p-2 bg-gray-100 dark:bg-gray-600 rounded cursor-move hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors ml-2 min-h-[2.5rem] flex flex-col space-y-1"
                                title={`${task.taskTitle} - Drag to move or double-click to remove`}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setDraggedTask(task);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Single click does nothing - prevents accidental removal
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  // Double-click to remove from calendar
                                  handleTaskClick(task, 'remove');
                                }}
                              >
                                {/* Time display above task title */}
                                {taskSocialMediaTimes.get(task.id) && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                    {taskSocialMediaTimes.get(task.id)}
                                  </div>
                                )}
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
                                  <div className="flex flex-wrap gap-1 mt-1 max-w-[120px]">
                                    {taskSocialMedia.get(task.id)?.map((platform, index) => (
                                      <SocialMediaIcon key={index} platform={platform} />
                                    ))}
                                  </div>
                                )}
                                {/* Links - positioned below social media */}
                                {(taskSocialMediaUrls.get(task.id) || task.taskUrl) && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <a 
                                      href={
                                        taskSocialMediaUrls.get(task.id)
                                          ? (taskSocialMediaUrls.get(task.id)?.startsWith("http") ? taskSocialMediaUrls.get(task.id) : `https://${taskSocialMediaUrls.get(task.id)}`)
                                          : task.taskUrl?.startsWith("http") ? task.taskUrl : `https://${task.taskUrl}`
                                      } 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs transition-colors"
                                      title="Visit Link"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <i className="fas fa-link text-[8px]"></i>
                                    </a>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Link</span>
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
                                title={`${task.taskTitle} - Double-click to remove`}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedTask(task);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => setDraggedTask(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Single click does nothing - prevents accidental removal
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  // Double-click to remove from calendar
                                  handleTaskClick(task, 'remove');
                                }}
                              >
                                {/* Time display above task title */}
                                {taskSocialMediaTimes.get(task.id) && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                    {taskSocialMediaTimes.get(task.id)}
                                  </div>
                                )}
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
                                  <div className="flex flex-wrap gap-1 mt-1 max-w-[120px]">
                                    {taskSocialMedia.get(task.id)?.map((platform, index) => (
                                      <SocialMediaIcon key={index} platform={platform} />
                                    ))}
                                  </div>
                                )}
                                {/* Links - positioned below social media */}
                                {(taskSocialMediaUrls.get(task.id) || task.taskUrl) && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <a 
                                      href={
                                        taskSocialMediaUrls.get(task.id)
                                          ? (taskSocialMediaUrls.get(task.id)?.startsWith("http") ? taskSocialMediaUrls.get(task.id) : `https://${taskSocialMediaUrls.get(task.id)}`)
                                          : task.taskUrl?.startsWith("http") ? task.taskUrl : `https://${task.taskUrl}`
                                      } 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs transition-colors"
                                      title="Visit Link"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <i className="fas fa-link text-[8px]"></i>
                                    </a>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Link</span>
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
      {(showCustomDividerModal || editingDivider) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingDivider ? 'Edit Calendar Task' : 'Add Calendar Task'}
              </h3>
              <button
                className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                onClick={() => {
                  setShowCustomDividerModal(null);
                  setEditingDivider(null);
                  setDividerName('');
                  setDividerMediaLink('');
                  setDividerTextLink('');
                  setSelectedProjectId('');
                  setSelectedEvergreenBoxId('');
                  setSelectedTeamMembers([]);
                  setSelectedColor('#3B82F6');
                  setSelectedIcon('fas fa-bookmark');
                }}
              >
                <i className="fas fa-times text-xs text-gray-600"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingDivider ? editingDivider.divider.name : dividerName}
                  onChange={(e) => editingDivider ? 
                    setEditingDivider({...editingDivider, divider: {...editingDivider.divider, name: e.target.value}}) : 
                    setDividerName(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Enter task name"
                />
              </div>
              {/* Assign to Project (moved to position 2) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign to Project (Optional)
                </label>
                <select
                  value={editingDivider ? editingDivider.divider.releaseId || '' : selectedProjectId}
                  onChange={(e) => editingDivider ? 
                    setEditingDivider({...editingDivider, divider: {...editingDivider.divider, releaseId: e.target.value || null}}) : 
                    setSelectedProjectId(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="">No Project</option>
                  {(() => {
                    // Get active projects for the selected date
                    if (showCustomDividerModal) {
                      const { day, month, year } = showCustomDividerModal;
                      const currentDate = new Date(year, month, day);
                      const activeReleases = releases.filter(release => {
                        const startDate = new Date(release.startDate);
                        const endDate = new Date(release.endDate);
                        return currentDate >= startDate && currentDate <= endDate;
                      });
                      return activeReleases.map(release => (
                        <option key={release.id} value={release.id}>{release.name}</option>
                      ));
                    } else if (editingDivider) {
                      // For editing, show all releases to avoid issues if date changed
                      return releases.map(release => (
                        <option key={release.id} value={release.id}>{release.name}</option>
                      ));
                    }
                    return [];
                  })()} 
                </select>
              </div>
              {/* Assign to Evergreen Box (moved to position 3) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign to Evergreen Box (Optional)
                </label>
                <select
                  value={editingDivider ? editingDivider.divider.evergreenBoxId || '' : selectedEvergreenBoxId}
                  onChange={(e) => editingDivider ? 
                    setEditingDivider({...editingDivider, divider: {...editingDivider.divider, evergreenBoxId: e.target.value || null}}) : 
                    setSelectedEvergreenBoxId(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="">No Evergreen Box</option>
                  {evergreenBoxes.map(box => (
                    <option key={box.id} value={box.id}>{box.title}</option>
                  ))}
                </select>
              </div>
              {/* Only show color picker when no project or evergreen box is assigned */}
              {((editingDivider && !editingDivider.divider.releaseId && !editingDivider.divider.evergreenBoxId) || (!editingDivider && !selectedProjectId && !selectedEvergreenBoxId)) && (
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
                        onClick={() => editingDivider ? 
                          setEditingDivider({...editingDivider, divider: {...editingDivider.divider, color}}) : 
                          setSelectedColor(color)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
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
                      onClick={() => editingDivider ? 
                        setEditingDivider({...editingDivider, divider: {...editingDivider.divider, icon}}) : 
                        setSelectedIcon(icon)
                      }
                    >
                      <i className={`${icon} text-gray-600 dark:text-gray-400`}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Media Link (Optional)
                </label>
                <input
                  type="url"
                  value={editingDivider ? editingDivider.divider.mediaLink || '' : dividerMediaLink}
                  onChange={(e) => editingDivider ? 
                    setEditingDivider({...editingDivider, divider: {...editingDivider.divider, mediaLink: e.target.value}}) : 
                    setDividerMediaLink(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Enter media link URL (e.g., image, video)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text Link (Optional)
                </label>
                <input
                  type="url"
                  value={editingDivider ? editingDivider.divider.textLink || '' : dividerTextLink}
                  onChange={(e) => editingDivider ? 
                    setEditingDivider({...editingDivider, divider: {...editingDivider.divider, textLink: e.target.value}}) : 
                    setDividerTextLink(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Enter text link URL (e.g., document, article)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Team Members (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {teamMembers.map(member => {
                    const isSelected = editingDivider 
                      ? editingDivider.divider.assignedMembers?.includes(member) || false
                      : selectedTeamMembers.includes(member);
                    
                    return (
                      <label key={member} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (editingDivider) {
                              const currentMembers = editingDivider.divider.assignedMembers || [];
                              const newMembers = e.target.checked 
                                ? [...currentMembers, member]
                                : currentMembers.filter((m: string) => m !== member);
                              setEditingDivider({...editingDivider, divider: {...editingDivider.divider, assignedMembers: newMembers}});
                            } else {
                              const newMembers = e.target.checked 
                                ? [...selectedTeamMembers, member]
                                : selectedTeamMembers.filter((m: string) => m !== member);
                              setSelectedTeamMembers(newMembers);
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{member}</span>
                      </label>
                    );
                  })}
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
                onClick={() => {
                  setShowCustomDividerModal(null);
                  setEditingDivider(null);
                  setDividerName('');
                  setDividerMediaLink('');
                  setDividerTextLink('');
                  setSelectedProjectId('');
                  setSelectedTeamMembers([]);
                  setSelectedColor('#3B82F6');
                  setSelectedIcon('fas fa-star');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const name = editingDivider ? editingDivider.divider.name : dividerName;
                  const color = editingDivider ? editingDivider.divider.color : selectedColor;
                  const icon = editingDivider ? editingDivider.divider.icon : selectedIcon;
                  const mediaLink = editingDivider ? editingDivider.divider.mediaLink : dividerMediaLink;
                  const textLink = editingDivider ? editingDivider.divider.textLink : dividerTextLink;
                  const projectId = editingDivider ? editingDivider.divider.releaseId : selectedProjectId;
                  const evergreenBoxId = editingDivider ? editingDivider.divider.evergreenBoxId : selectedEvergreenBoxId;
                  const teamMembers = editingDivider ? editingDivider.divider.assignedMembers : selectedTeamMembers;
                  
                  if (!name.trim()) return;
                  
                  if (editingDivider) {
                    // Edit existing divider
                    const updateData = {
                      name,
                      color,
                      icon,
                      mediaLink: mediaLink || null,
                      textLink: textLink || null,
                      releaseId: projectId || null,
                      evergreenBoxId: evergreenBoxId || null,
                      assignedMembers: teamMembers || [],
                      dateKey: editingDivider.dateKey
                    };
                    updateCustomDividerMutation.mutate({ id: editingDivider.divider.id, data: updateData });
                    setEditingDivider(null);
                  } else if (showCustomDividerModal) {
                    // Add new divider
                    const { day, month, year } = showCustomDividerModal;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    
                    const newDividerData = {
                      name,
                      color,
                      icon,
                      mediaLink: mediaLink || null,
                      textLink: textLink || null,
                      dateKey,
                      releaseId: projectId || null,
                      evergreenBoxId: evergreenBoxId || null,
                      assignedMembers: teamMembers || [],
                      completed: false
                    };
                    saveCustomDividerMutation.mutate(newDividerData);
                    setShowCustomDividerModal(null);
                  }
                  
                  // Reset form
                  setDividerName('');
                  setDividerMediaLink('');
                  setDividerTextLink('');
                  setSelectedProjectId('');
                  setSelectedEvergreenBoxId('');
                  setSelectedTeamMembers([]);
                  setSelectedColor('#3B82F6');
                  setSelectedIcon('fas fa-star');
                }}
              >
                {editingDivider ? 'Update Divider' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Delete
              </h3>
              <button
                className="w-6 h-6 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                onClick={() => setDeleteConfirmModal(null)}
              >
                <i className="fas fa-times text-xs text-gray-600"></i>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the divider <strong>"{deleteConfirmModal.divider.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const { divider } = deleteConfirmModal;
                  if (divider.id) {
                    deleteCustomDividerMutation.mutate(divider.id);
                  }
                  setDeleteConfirmModal(null);
                  toast({
                    title: "Divider deleted",
                    description: "The custom divider has been successfully removed.",
                  });
                }}
              >
                Delete
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
            
            {/* Link/URL Field */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-link text-gray-500"></i>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link</label>
              </div>
              <input
                type="url"
                placeholder="https://example.com"
                value={taskSocialMediaUrls.get(showSocialMediaModal) || ''}
                onChange={(e) => {
                  const newUrls = new Map(taskSocialMediaUrls);
                  if (e.target.value) {
                    newUrls.set(showSocialMediaModal, e.target.value);
                  } else {
                    newUrls.delete(showSocialMediaModal);
                  }
                  setTaskSocialMediaUrls(newUrls);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
              />
            </div>
            
            {/* Time Field */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-clock text-gray-500"></i>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time (Optional)</label>
              </div>
              <input
                type="text"
                placeholder="9:30 AM NY"
                value={taskSocialMediaTimes.get(showSocialMediaModal) || ''}
                onChange={(e) => {
                  const newTimes = new Map(taskSocialMediaTimes);
                  if (e.target.value) {
                    newTimes.set(showSocialMediaModal, e.target.value);
                  } else {
                    newTimes.delete(showSocialMediaModal);
                  }
                  setTaskSocialMediaTimes(newTimes);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
              />
            </div>
            
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
                      
                      // Save to backend with URL
                      const updatedPlatforms = newTaskSocialMedia.get(showSocialMediaModal) || [];
                      const currentUrl = taskSocialMediaUrls.get(showSocialMediaModal);
                      saveTaskSocialMediaMutation.mutate({ 
                        taskId: showSocialMediaModal, 
                        platforms: updatedPlatforms,
                        linkUrl: currentUrl
                      });
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
                onClick={() => {
                  const platforms = taskSocialMedia.get(showSocialMediaModal!) || [];
                  const linkUrl = taskSocialMediaUrls.get(showSocialMediaModal!);
                  saveTaskSocialMediaMutation.mutate({ 
                    taskId: showSocialMediaModal!, 
                    platforms,
                    linkUrl
                  });
                  setShowSocialMediaModal(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
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