import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FileText, MessageSquare, Video, Palette, Image, Users } from "lucide-react";
import type { ContentFormatAssignment } from "@shared/schema";

const teamMembers = ["Brian", "Alex", "Lucas", "Victor"];
const formatTypes = [
  { type: "article", label: "Article", icon: FileText },
  { type: "thread", label: "Thread", icon: MessageSquare },
  { type: "video", label: "Video", icon: Video },
  { type: "animation", label: "Animation", icon: Palette },
  { type: "visual", label: "Visual", icon: Image },
];

interface FormatAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FormatAssignmentsModal({ isOpen, onClose }: FormatAssignmentsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  // Fetch current assignments
  const { data: currentAssignments = [], isLoading } = useQuery<ContentFormatAssignment[]>({
    queryKey: ["/api/content-format-assignments"],
    enabled: isOpen,
  });

  // Initialize assignments when data loads
  useEffect(() => {
    if (isOpen) {
      if (currentAssignments.length > 0) {
        const assignmentMap = currentAssignments.reduce((acc, assignment) => {
          acc[assignment.formatType] = assignment.assignedMembers;
          return acc;
        }, {} as Record<string, string[]>);
        setAssignments(assignmentMap);
      } else {
        // Initialize with empty arrays
        const emptyAssignments = formatTypes.reduce((acc, format) => {
          acc[format.type] = [];
          return acc;
        }, {} as Record<string, string[]>);
        setAssignments(emptyAssignments);
      }
    }
  }, [currentAssignments, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (assignmentData: Record<string, string[]>) => {
      // Find members that were removed from each format type
      const oldAssignments = currentAssignments.reduce((acc, assignment) => {
        acc[assignment.formatType] = assignment.assignedMembers;
        return acc;
      }, {} as Record<string, string[]>);

      // Clean up ALL existing format-based tasks to prevent duplicates
      try {
        const tasksResponse = await fetch("/api/checklist-tasks");
        const allTasks = await tasksResponse.json();
        
        console.log("All tasks before cleanup:", allTasks.length);
        
        // Find all tasks that are format-based (have waterfallCycleId and contentFormatType)
        const formatTasks = allTasks.filter((task: any) => 
          task.waterfallCycleId && task.contentFormatType
        );
        
        console.log("Format tasks to delete:", formatTasks.length, formatTasks.map(t => ({id: t.id, title: t.taskTitle, assignedTo: t.assignedTo})));
        
        // Delete all format-based tasks sequentially with error handling
        for (const task of formatTasks) {
          try {
            const deleteResponse = await fetch(`/api/checklist-tasks/${task.id}`, {
              method: "DELETE"
            });
            console.log(`Deleted task ${task.id}:`, deleteResponse.status);
          } catch (deleteError) {
            console.error(`Failed to delete task ${task.id}:`, deleteError);
          }
        }
        
        // Wait a moment for deletes to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Failed to cleanup existing format tasks:", error);
      }

      // Clear existing assignments and create new ones
      await fetch("/api/content-format-assignments", {
        method: "DELETE",
      });

      // Create new assignments
      const promises = Object.entries(assignmentData)
        .filter(([_, members]) => members.length > 0)
        .map(([formatType, members]) =>
          fetch("/api/content-format-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              formatType,
              assignedMembers: members,
            }),
          })
        );

      await Promise.all(promises);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-format-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      
      // Regenerate tasks for existing boxes and releases with waterfall cycles
      try {
        // Get all current data
        const [boxesResponse, releasesResponse, cyclesResponse] = await Promise.all([
          fetch("/api/evergreen-boxes"),
          fetch("/api/releases"),
          fetch("/api/waterfall-cycles")
        ]);
        
        const boxes = await boxesResponse.json();
        const releases = await releasesResponse.json();
        const cycles = await cyclesResponse.json();
        
        // Get new assignments
        const assignmentsResponse = await fetch("/api/content-format-assignments");
        const assignments = await assignmentsResponse.json();
        
        // Regenerate tasks for evergreen boxes
        for (const box of boxes) {
          if (box.waterfallCycleId) {
            const cycle = cycles.find((c: any) => c.id === box.waterfallCycleId);
            if (cycle) {
              for (const assignment of assignments) {
                const formatType = assignment.formatType;
                const requirement = cycle.contentRequirements[formatType] || 0;
                
                if (requirement > 0) {
                  for (const member of assignment.assignedMembers) {
                    const taskName = `${box.title} > ${formatType.charAt(0).toUpperCase() + formatType.slice(1)}`;
                    
                    await fetch("/api/checklist-tasks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        taskTitle: taskName,
                        assignedTo: member,
                        evergreenBoxId: box.id,
                        waterfallCycleId: box.waterfallCycleId,
                        contentFormatType: formatType,
                        completed: false
                      }),
                    });
                  }
                }
              }
            }
          }
        }
        
        // Regenerate tasks for releases
        for (const release of releases) {
          if (release.waterfallCycleId) {
            const cycle = cycles.find((c: any) => c.id === release.waterfallCycleId);
            if (cycle) {
              for (const assignment of assignments) {
                const formatType = assignment.formatType;
                const requirement = cycle.contentRequirements[formatType] || 0;
                
                if (requirement > 0) {
                  for (const member of assignment.assignedMembers) {
                    const taskName = `${cycle.name} > ${requirement}x ${formatType.charAt(0).toUpperCase() + formatType.slice(1)}`;
                    
                    await fetch("/api/checklist-tasks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        taskTitle: taskName,
                        assignedTo: member,
                        releaseId: release.id,
                        waterfallCycleId: release.waterfallCycleId,
                        contentFormatType: formatType,
                        completed: false
                      }),
                    });
                  }
                }
              }
            }
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      } catch (error) {
        console.error("Failed to regenerate tasks:", error);
      }
      
      toast({ title: "Format assignments saved successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save format assignments", variant: "destructive" });
    },
  });

  const handleMemberToggle = (formatType: string, member: string) => {
    setAssignments(prev => {
      const currentMembers = prev[formatType] || [];
      const isAssigned = currentMembers.includes(member);
      
      return {
        ...prev,
        [formatType]: isAssigned
          ? currentMembers.filter(m => m !== member)
          : [...currentMembers, member]
      };
    });
  };

  const handleSave = () => {
    saveMutation.mutate(assignments);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Content Format Team Assignments</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assign team members to different content format types. This determines who is responsible for creating each type of content in waterfall cycles.
          </p>

          {isLoading ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : (
            <div className="space-y-4">
              {formatTypes.map((format) => {
                const Icon = format.icon;
                const assignedMembers = assignments[format.type] || [];
                
                return (
                  <Card key={format.type}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Icon className="h-5 w-5" />
                        <span className="capitalize">{format.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {assignedMembers.length} assigned
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {teamMembers.map((member) => {
                          const isAssigned = assignedMembers.includes(member);
                          
                          return (
                            <div key={member} className="flex items-center space-x-3">
                              <Checkbox
                                id={`${format.type}-${member}`}
                                checked={isAssigned}
                                onCheckedChange={() => handleMemberToggle(format.type, member)}
                              />
                              <label
                                htmlFor={`${format.type}-${member}`}
                                className="flex items-center space-x-2 cursor-pointer"
                              >
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{member}</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-[#7232d9] hover:bg-[#6028c5]"
            >
              {saveMutation.isPending ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}