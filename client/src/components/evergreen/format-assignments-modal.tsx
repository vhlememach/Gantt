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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-format-assignments"] });
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