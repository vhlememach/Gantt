import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Rocket, Box,
  Briefcase, Building, Calculator, Calendar, BarChart3, LineChart, 
  Clipboard, Database, File, Folder, Globe, TrendingUp, Users, 
  Settings, Shield, Target, PieChart, FileText, FolderOpen, Archive,
  Code, Cpu, HardDrive, Laptop, Monitor, Mouse, Phone, Router, 
  Server, Smartphone, Tablet, Wifi, Battery, Bluetooth, Camera, 
  Headphones, Keyboard, Zap, Power, Usb,
  Edit, Hammer, Key, Lock, Wand2, RefreshCw, Save, 
  Wrench, Trash, Unlock, Paintbrush, Scissors, Ruler, 
  Navigation, Flashlight, Cog,
  Mail, MessageCircle, MessageSquare, PhoneCall, Send, Share2, 
  Video, Mic, Megaphone, Bell, Radio, Satellite, Rss,
  Volume2, Headset, Speaker, MessageSquareMore, AtSign, Hash,
  Car, Truck, Plane, Train, Ship, Bike, Bus, 
  PlaneTakeoff, PlaneLanding, MapPin, Map, Compass, 
  Route, Navigation2, Move, ArrowRight, ArrowUp, ArrowDown,
  TreePine, Leaf, Flower, Sun, Moon, Star, Cloud, 
  Snowflake, Droplets, Flame, Atom, Dna, Microscope, Telescope, 
  TestTube, Magnet, Thermometer, Wind
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Release, ChecklistTask } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

const getStatusColor = (status: string) => {
  // Use CSS custom properties for dynamic status colors
  const colors = {
    completed: 'var(--status-completed, #22c55e)',
    'in-progress': 'var(--status-in-progress, #3b82f6)',
    delayed: 'var(--status-delayed, #ef4444)',
    upcoming: 'var(--status-upcoming, #f59e0b)',
  };
  
  return colors[status as keyof typeof colors] || colors.upcoming;
};

interface TimelineBarProps {
  release: Release;
  group: { id: string; name: string; color: string; gradientEnabled?: string; gradientSecondaryColor?: string };
  onEdit: () => void;
  viewMode: string;
  viewType: "Normal" | "Condensed";
  timelineLabels: string[];
}

export default function TimelineBar({ release, group, onEdit, viewMode, viewType, timelineLabels }: TimelineBarProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState({
    startDate: new Date(release.startDate),
    endDate: new Date(release.endDate),
  });
  const barRef = useRef<HTMLDivElement>(null);

  // Fetch checklist tasks for this release to calculate progress
  const { data: checklistTasks = [] } = useQuery<ChecklistTask[]>({
    queryKey: ["/api/checklist-tasks", "release", release.id],
    queryFn: () => fetch(`/api/checklist-tasks/release/${release.id}`).then(res => res.json()),
  });

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (checklistTasks.length === 0) return 0;
    const completedTasks = checklistTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / checklistTasks.length) * 100);
  }, [checklistTasks]);

  // Priority is determined by the release itself, not individual tasks

  const updateReleaseMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      const response = await apiRequest("PUT", `/api/releases/${release.id}`, data);
      if (!response.ok) {
        throw new Error('Failed to update release');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Release updated successfully" });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: "Failed to update release", variant: "destructive" });
    },
  });

  // Calculate bar position and width based on dates and view mode
  // Use useMemo to recalculate when release dates change
  const { leftPosition, width } = useMemo(() => {
    const startDate = new Date(release.startDate);
    const endDate = new Date(release.endDate);
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let position = 0;
    let barWidth = 8;
  
    if (viewMode === "Quarters") {
      // Find the start and end quarters in the timeline labels
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const startQuarter = Math.floor(startDate.getMonth() / 3) + 1; // 1-4
      const endQuarter = Math.floor(endDate.getMonth() / 3) + 1; // 1-4
      
      const startLabel = `Q${startQuarter} ${startYear}`;
      const endLabel = `Q${endQuarter} ${endYear}`;
      
      const startQuarterIndex = timelineLabels.findIndex(label => label === startLabel);
      const endQuarterIndex = timelineLabels.findIndex(label => label === endLabel);
      
      if (startQuarterIndex >= 0) {
        const quarterWidth = 100 / timelineLabels.length;
        position = (startQuarterIndex / timelineLabels.length) * 100;
        
        // Add offset within the start quarter based on month
        const monthInQuarter = startDate.getMonth() % 3; // 0-2
        const monthOffset = (monthInQuarter / 3) * quarterWidth;
        position += monthOffset;
        
        if (endQuarterIndex >= 0) {
          // Calculate end position
          const endQuarterPosition = ((endQuarterIndex + 1) / timelineLabels.length) * 100; // +1 to include end quarter
          const endMonthInQuarter = endDate.getMonth() % 3; // 0-2
          const endMonthOffset = ((endMonthInQuarter + 1) / 3) * quarterWidth;
          const endPosition = endQuarterPosition - quarterWidth + endMonthOffset;
          
          barWidth = Math.max(8, endPosition - position);
        } else {
          barWidth = Math.max(8, quarterWidth);
        }
      }
    } else if (viewMode === "Months") {
      // Months view: each month gets equal space
      const startMonth = startDate.getMonth(); // 0-11
      const endMonth = endDate.getMonth(); // 0-11
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const startMonthIndex = timelineLabels.findIndex(label => {
        const parts = label.split(" ");
        if (parts.length === 2) {
          const labelMonth = monthNames.indexOf(parts[0]);
          const labelYear = parseInt(parts[1]);
          return labelMonth === startMonth && labelYear === startYear;
        }
        return false;
      });
      
      const endMonthIndex = timelineLabels.findIndex(label => {
        const parts = label.split(" ");
        if (parts.length === 2) {
          const labelMonth = monthNames.indexOf(parts[0]);
          const labelYear = parseInt(parts[1]);
          return labelMonth === endMonth && labelYear === endYear;
        }
        return false;
      });
      
      if (startMonthIndex >= 0) {
        const monthWidth = 100 / timelineLabels.length;
        position = (startMonthIndex / timelineLabels.length) * 100;
        const dayOfMonth = startDate.getDate() - 1; // 0-based
        const monthOffset = (dayOfMonth / 31) * monthWidth; // Position within start month
        position += monthOffset;
        
        if (endMonthIndex >= 0) {
          const endPosition = ((endMonthIndex + 1) / timelineLabels.length) * 100; // +1 to include end month
          barWidth = Math.max(6, endPosition - position);
        } else {
          barWidth = Math.max(6, monthWidth);
        }
      }
    } else if (viewMode === "Weeks") {
      // Weeks view: position based on week of year
      const startOfYear = new Date(startDate.getFullYear(), 0, 1);
      const startWeek = Math.floor((startDate.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const endWeek = Math.floor((endDate.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      position = Math.min(95, (startWeek / 52) * 100); // Max 95% to prevent overflow
      const endPosition = Math.min(100, (endWeek / 52) * 100);
      barWidth = Math.max(4, endPosition - position);
    }
    
    return { leftPosition: position, width: barWidth };
  }, [release.startDate, release.endDate, viewMode, timelineLabels]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    setStartX(e.clientX);
    setOriginalDates({
      startDate: new Date(release.startDate),
      endDate: new Date(release.endDate),
    });
    
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const deltaX = e.clientX - startX;
    const daysDelta = Math.round(deltaX / 3); // Approximate days per pixel
    
    if (isDragging) {
      // Update position visually (you can add visual feedback here)
    } else if (isResizing) {
      // Update width visually (you can add visual feedback here)
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging || isResizing) {
      const deltaX = e.clientX - startX;
      const daysDelta = Math.round(deltaX / 30); // Adjusted for better sensitivity
      
      if (isDragging && Math.abs(daysDelta) > 0) {
        // Move both dates
        const newStartDate = new Date(originalDates.startDate);
        const newEndDate = new Date(originalDates.endDate);
        newStartDate.setDate(newStartDate.getDate() + daysDelta);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
        
        updateReleaseMutation.mutate({
          startDate: newStartDate.toISOString().split('T')[0],
          endDate: newEndDate.toISOString().split('T')[0],
        });
      } else if (isResizing && Math.abs(daysDelta) > 0) {
        // Only move end date
        const newEndDate = new Date(originalDates.endDate);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
        
        if (newEndDate > originalDates.startDate) {
          updateReleaseMutation.mutate({
            startDate: originalDates.startDate.toISOString().split('T')[0],
            endDate: newEndDate.toISOString().split('T')[0],
          });
        }
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, startX, originalDates]);



  return (
    <div className="relative w-full h-full"> {/* Full width container */}
      <div
        ref={barRef}
        className={`absolute ${viewType === "Condensed" ? "h-8" : "h-10"} rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200`}
        style={{
          left: `${leftPosition}%`,
          width: `${width}%`,
          top: '50%',
          transform: 'translateY(-50%)',
          background: group.color,
          minWidth: '120px',
          outline: release.highPriority ? `2px solid #dc2626` : 'none',
          outlineOffset: release.highPriority ? '2px' : '0'
        }}
        onClick={(e) => {
          onEdit();
        }}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <div className="timeline-bar-content flex items-center justify-between h-full px-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {release.icon.startsWith('lucide-') ? (
              (() => {
                const iconName = release.icon.replace('lucide-', '');
                const iconMap: Record<string, React.ComponentType<any>> = {
                  Box, Briefcase, Building, Calculator, Calendar, BarChart3, LineChart, 
                  Clipboard, Database, File, Folder, Globe, TrendingUp, Users, 
                  Settings, Shield, Target, PieChart, FileText, FolderOpen, Archive,
                  Code, Cpu, HardDrive, Laptop, Monitor, Mouse, Phone, Router, 
                  Server, Smartphone, Tablet, Wifi, Battery, Bluetooth, Camera, 
                  Headphones, Keyboard, Zap, Power, Usb,
                  Edit, Hammer, Key, Lock, Wand2, RefreshCw, Save, 
                  Wrench, Trash, Unlock, Paintbrush, Scissors, Ruler, 
                  Navigation, Flashlight, Cog,
                  Mail, MessageCircle, MessageSquare, PhoneCall, Send, Share2, 
                  Video, Mic, Megaphone, Bell, Radio, Satellite, Rss,
                  Volume2, Headset, Speaker, MessageSquareMore, AtSign, Hash,
                  Car, Truck, Plane, Train, Ship, Bike, Bus, 
                  PlaneTakeoff, PlaneLanding, MapPin, Map, Compass, 
                  Route, Navigation2, Move, ArrowRight, ArrowUp, ArrowDown,
                  TreePine, Leaf, Flower, Sun, Moon, Star, Cloud, 
                  Snowflake, Droplets, Flame, Atom, Dna, Microscope, Telescope, 
                  TestTube, Magnet, Thermometer, Wind
                };
                const IconComponent = iconMap[iconName] || Rocket;
                return <IconComponent className="w-4 h-4 text-white flex-shrink-0" />;
              })()
            ) : (
              <i className={`${release.icon} text-white text-sm flex-shrink-0`} />
            )}
            <span 
              className="text-white font-medium text-sm truncate flex items-center"
              style={{ 
                lineHeight: '1.4',
                paddingTop: '2px',
                paddingBottom: '2px'
              }}
            >
              {release.name}
            </span>
          </div>
          
          {/* Progress percentage between title and status */}
          {checklistTasks.length > 0 && (
            <div className="flex items-center space-x-2 pr-6">
              <div className="text-white text-xs font-medium">
                {completionPercentage}%
              </div>
              <div className="w-8 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white bg-opacity-80 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Status Circle - positioned at top-right corner */}
        <div 
          className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white z-10"
          style={{ backgroundColor: getStatusColor(release.status || 'upcoming') }}
          title={`Status: ${release.status || 'upcoming'}`}
        />
        
        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 hover:opacity-100 bg-white bg-opacity-20"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      </div>
    </div>
  );
}
