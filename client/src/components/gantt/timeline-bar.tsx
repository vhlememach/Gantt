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
  
  // Simple positioning calculation (this would be more sophisticated in a real implementation)
  const baseDate = new Date("2024-01-01");
  const daysFromBase = Math.ceil((startDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const leftPosition = (daysFromBase / 30) * 100; // Approximate month positioning
  const width = (duration / 30) * 100; // Approximate width

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
      const daysDelta = Math.round(deltaX / 3);
      
      if (isDragging && daysDelta !== 0) {
        // Move both dates
        const newStartDate = new Date(originalDates.startDate);
        const newEndDate = new Date(originalDates.endDate);
        newStartDate.setDate(newStartDate.getDate() + daysDelta);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
        
        updateReleaseMutation.mutate({
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        });
      } else if (isResizing && daysDelta !== 0) {
        // Only move end date
        const newEndDate = new Date(originalDates.endDate);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
        
        if (newEndDate > originalDates.startDate) {
          updateReleaseMutation.mutate({
            startDate: originalDates.startDate.toISOString(),
            endDate: newEndDate.toISOString(),
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
    <div className="relative h-12">
      <div
        ref={barRef}
        className="absolute top-0 h-full rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
        style={{
          left: `${leftPosition}px`,
          width: `${Math.max(width, 120)}px`,
          background: `linear-gradient(135deg, ${groupColor}, ${groupColor}dd)`,
        }}
        onClick={onEdit}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-2">
            <i className={`${release.icon} text-white text-sm`} />
            <span className="text-white font-medium text-sm truncate">
              {release.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${getStatusColor(release.status || 'upcoming')}`}
              title={`Status: ${release.status || 'upcoming'}`}
            />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full" />
              <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full" />
              <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full" />
            </div>
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
