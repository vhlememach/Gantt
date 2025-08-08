import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Release } from "@shared/schema";

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
  group: { id: string; name: string; color: string; gradientEnabled?: string; gradientIntensity?: string };
  onEdit: () => void;
  viewMode: string;
  timelineLabels: string[];
}

export default function TimelineBar({ release, group, onEdit, viewMode, timelineLabels }: TimelineBarProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [originalDates, setOriginalDates] = useState({
    startDate: new Date(release.startDate),
    endDate: new Date(release.endDate),
  });
  const barRef = useRef<HTMLDivElement>(null);

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
      // Quarters view: Q1 = 0-25%, Q2 = 25-50%, Q3 = 50-75%, Q4 = 75-100%
      const startMonth = startDate.getMonth(); // 0-11
      const endMonth = endDate.getMonth(); // 0-11
      const startQuarter = Math.floor(startMonth / 3); // 0-3
      const endQuarter = Math.floor(endMonth / 3); // 0-3
      
      // Calculate position based on start quarter and month within quarter
      const monthInQuarter = startMonth % 3; // 0-2
      const quarterWidth = 100 / timelineLabels.length; // Width per quarter
      const quarterStart = startQuarter * quarterWidth;
      const monthOffset = (monthInQuarter / 3) * quarterWidth;
      position = quarterStart + monthOffset;
      
      // Calculate width to span from start to end position
      const endQuarterStart = endQuarter * quarterWidth;
      const endMonthInQuarter = endMonth % 3;
      const endMonthOffset = ((endMonthInQuarter + 1) / 3) * quarterWidth; // +1 to include the end month
      const endPosition = endQuarterStart + endMonthOffset;
      
      barWidth = Math.max(8, endPosition - position);
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

  // Debug logging for timeline bars
  console.log(`Timeline bar for ${release.name}:`, {
    startDate: release.startDate,
    endDate: release.endDate,
    leftPosition,
    width,
    releaseId: release.id
  });

  return (
    <div className="relative w-full h-14"> {/* Container height matches sidebar items */}
      <div
        ref={barRef}
        className="absolute top-0 h-14 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 z-10"
        style={{
          left: `${leftPosition}%`,
          width: `${width}%`,
          background: group.gradientEnabled === "true" 
            ? `linear-gradient(135deg, ${group.color}, ${group.color}${group.gradientIntensity || '40'})`
            : group.color,
          minWidth: '120px', // Ensure minimum width for content
        }}
        onClick={(e) => {
          console.log('Timeline bar clicked:', release.id);
          onEdit();
        }}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <div className="flex items-center justify-between h-full px-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {release.icon.startsWith('lucide-') ? (
              (() => {
                const iconName = release.icon.replace('lucide-', '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/^[a-z]/, match => match.toUpperCase());
                const IconComponent = (Icons as any)[iconName] || Icons.Rocket;
                return <IconComponent className="w-4 h-4 text-white flex-shrink-0" />;
              })()
            ) : (
              <i className={`${release.icon} text-white text-sm flex-shrink-0`} />
            )}
            <span className="text-white font-medium text-sm truncate">
              {release.name}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor(release.status || 'upcoming') }}
              title={`Status: ${release.status || 'upcoming'}`}
            />
          </div>
        </div>
        
        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 hover:opacity-100 bg-white bg-opacity-20"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      </div>
    </div>
  );
}
