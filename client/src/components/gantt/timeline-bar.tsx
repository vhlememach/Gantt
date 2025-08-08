import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Release } from "@shared/schema";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-400';
    case 'in-progress':
      return 'bg-blue-400';
    case 'delayed':
      return 'bg-red-400';
    case 'upcoming':
    default:
      return 'bg-yellow-400';
  }
};

interface TimelineBarProps {
  release: Release;
  groupColor: string;
  onEdit: () => void;
}

export default function TimelineBar({ release, groupColor, onEdit }: TimelineBarProps) {
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

  // Calculate bar position and width based on dates
  const startDate = new Date(release.startDate);
  const endDate = new Date(release.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Simple positioning calculation that maps to timeline quarters
  // For 2025: Q1 = 0-25%, Q2 = 25-50%, Q3 = 50-75%, Q4 = 75-100%
  const releaseYear = startDate.getFullYear();
  const month = startDate.getMonth(); // 0-11
  const quarter = Math.floor(month / 3); // 0-3
  
  // Position within the quarter based on the month
  const monthInQuarter = month % 3; // 0-2
  const quarterStart = quarter * 25; // 0, 25, 50, or 75
  const monthOffset = (monthInQuarter / 3) * 25; // 0-8.33% within quarter
  
  const leftPosition = quarterStart + monthOffset;
  const width = Math.max(8, Math.min(20, (duration / 30) * 5)); // Width based on duration

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
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    duration,
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
          background: `linear-gradient(135deg, ${groupColor}, ${groupColor}dd)`,
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
            <i className={`${release.icon} text-white text-sm flex-shrink-0`} />
            <span className="text-white font-medium text-sm truncate">
              {release.name}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div 
              className={`w-3 h-3 rounded-full ${getStatusColor(release.status || 'upcoming')}`}
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
