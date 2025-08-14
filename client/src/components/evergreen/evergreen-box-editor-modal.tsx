import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EvergreenBox, ReleaseGroup, WaterfallCycle, InsertEvergreenBox } from "@shared/schema";
import { insertEvergreenBoxSchema } from "@shared/schema";

const formSchema = insertEvergreenBoxSchema.extend({
  title: z.string().min(1, "Title is required"),
  groupId: z.string().min(1, "Group is required"),
  url: z.string().optional(),
});

interface EvergreenBoxEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxId?: string | null;
}

export default function EvergreenBoxEditorModal({ isOpen, onClose, boxId }: EvergreenBoxEditorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!boxId;

  // Fetch existing box data for editing
  const { data: box, isLoading: boxLoading, error: boxError } = useQuery<EvergreenBox>({
    queryKey: ["/api/evergreen-boxes", boxId],
    queryFn: async () => {
      if (!boxId) throw new Error("Box ID is required");
      const response = await fetch(`/api/evergreen-boxes/${boxId}`);
      if (!response.ok) throw new Error("Failed to fetch box data");
      return response.json();
    },
    enabled: isEditing && isOpen && !!boxId,
  });

  // Fetch groups and waterfall cycles for dropdowns
  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
    enabled: isOpen,
  });

  const { data: waterfallCycles = [] } = useQuery<WaterfallCycle[]>({
    queryKey: ["/api/waterfall-cycles"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      groupId: "",
      responsible: "",
      icon: "lucide-megaphone",
      waterfallCycleId: "none",
      url: "",
    },
  });

  // Reset form when box data loads or modal opens
  useEffect(() => {
    console.log('useEffect triggered - box:', box, 'isEditing:', isEditing, 'isOpen:', isOpen, 'boxLoading:', boxLoading, 'boxId:', boxId, 'boxError:', boxError);
    
    if (isEditing && isOpen && box && !boxLoading) {
      console.log('Populating form with box data:', box);
      const formData = {
        title: box.title || "",
        description: box.description || "",
        groupId: box.groupId || "",
        responsible: box.responsible || "",
        icon: box.icon || "lucide-megaphone",
        waterfallCycleId: box.waterfallCycleId || "none",
        url: box.url || "",
      };
      console.log('Form data being set:', formData);
      
      // Reset form first, then set individual values
      form.reset(formData);
      
      // Double-check by setting each field explicitly with a small delay
      setTimeout(() => {
        Object.entries(formData).forEach(([key, value]) => {
          form.setValue(key as keyof typeof formData, value);
          console.log(`Set ${key} to:`, value);
        });
      }, 50);
    } else if (!isEditing && isOpen) {
      console.log('Resetting form for new box');
      form.reset({
        title: "",
        description: "",
        groupId: "",
        responsible: "",
        icon: "lucide-megaphone",
        waterfallCycleId: "none",
        url: "",
      });
    }
  }, [box, isEditing, isOpen, boxLoading, boxId, boxError, form]);

  // Function to generate evergreen tasks based on waterfall cycle assignments
  const generateEvergreenTasks = async (boxId: string, waterfallCycleId: string, boxTitle: string) => {
    try {
      // Get waterfall cycle details
      const cycleResponse = await apiRequest("GET", `/api/waterfall-cycles/${waterfallCycleId}`);
      const cycle = await cycleResponse.json();

      // Get format assignments
      const assignmentsResponse = await apiRequest("GET", "/api/content-format-assignments");
      const assignments = await assignmentsResponse.json();

      // Generate tasks for each format type based on assignments
      const taskPromises = assignments.map(async (assignment: any) => {
        const formatType = assignment.formatType;
        const requirement = cycle.contentRequirements[formatType] || 0;
        
        if (requirement > 0) {
          // Create tasks for each assigned member
          return assignment.assignedMembers.map(async (member: string) => {
            const taskName = `${boxTitle} > ${formatType.charAt(0).toUpperCase() + formatType.slice(1)}`;
            
            const taskPayload = {
              taskTitle: taskName,
              assignedTo: member,
              evergreenBoxId: boxId,
              waterfallCycleId: waterfallCycleId,
              contentFormatType: formatType,
              completed: false
            };

            return apiRequest("POST", "/api/checklist-tasks", taskPayload);
          });
        }
        return [];
      });

      await Promise.all(taskPromises.flat());
      
      // Invalidate checklist tasks to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      
    } catch (error) {
      console.error('Error generating evergreen tasks:', error);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertEvergreenBox) => {
      const response = await fetch("/api/evergreen-boxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: async (newBox) => {
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes"] });
      
      // If waterfall cycle is assigned, generate format-based checklist tasks
      const waterfallCycleId = form.getValues('waterfallCycleId');
      if (waterfallCycleId && waterfallCycleId !== "none") {
        await generateEvergreenTasks(newBox.id, waterfallCycleId, newBox.title);
      }
      
      toast({ title: "Evergreen box created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create evergreen box", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertEvergreenBox>) => {
      const response = await fetch(`/api/evergreen-boxes/${boxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: async (updatedBox) => {
      const waterfallCycleId = form.getValues('waterfallCycleId');
      
      // Always clean up existing tasks first to prevent duplicates
      try {
        console.log("Cleaning up existing tasks for evergreen box update...");
        const tasksResponse = await fetch("/api/checklist-tasks");
        const allTasks = await tasksResponse.json();
        
        // Find and delete all tasks for this evergreen box
        const boxTasks = allTasks.filter((task: any) => task.evergreenBoxId === updatedBox.id);
        
        console.log("Tasks to delete for evergreen box update:", boxTasks.length);
        
        for (const task of boxTasks) {
          try {
            await fetch(`/api/checklist-tasks/${task.id}`, { method: "DELETE" });
            console.log(`Deleted task ${task.id} for evergreen box update`);
          } catch (deleteError) {
            console.error(`Failed to delete task ${task.id}:`, deleteError);
          }
        }
        
        // Wait for deletions to process
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Failed to cleanup evergreen tasks:", error);
      }
      
      // If waterfall cycle is assigned, generate new format-based checklist tasks
      if (waterfallCycleId && waterfallCycleId !== "none") {
        await generateEvergreenTasks(updatedBox.id, waterfallCycleId, updatedBox.title);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes", boxId] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      
      toast({ title: "Evergreen box updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update evergreen box", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First, clean up all related tasks for this evergreen box
      try {
        console.log("Starting evergreen box deletion cleanup...");
        const tasksResponse = await fetch("/api/checklist-tasks");
        const allTasks = await tasksResponse.json();
        
        // Find all tasks related to this evergreen box
        const tasksToDelete = allTasks.filter((task: any) => 
          task.evergreenBoxId === boxId
        );
        
        console.log("Tasks to delete for evergreen box:", tasksToDelete.length, tasksToDelete.map((t: any) => ({ 
          id: t.id, 
          title: t.taskTitle,
          evergreenBoxId: t.evergreenBoxId
        })));
        
        // Delete all related tasks sequentially
        for (const task of tasksToDelete) {
          try {
            const deleteResponse = await fetch(`/api/checklist-tasks/${task.id}`, { method: "DELETE" });
            console.log(`Deleted task ${task.id} (${task.taskTitle}):`, deleteResponse.status);
          } catch (deleteError) {
            console.error(`Failed to delete task ${task.id}:`, deleteError);
          }
        }
        
        console.log("All related tasks deleted successfully");
        
        // Wait for deletions to fully process
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Failed to cleanup related tasks:", error);
      }

      // Now delete the evergreen box
      const response = await fetch(`/api/evergreen-boxes/${boxId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      toast({ title: "Evergreen box and related tasks deleted successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to delete evergreen box", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert "none" back to empty string for the API
    const submitData = {
      ...data,
      waterfallCycleId: data.waterfallCycleId === "none" ? "" : data.waterfallCycleId,
    };
    
    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = () => {
    if (isEditing && boxId && confirm("Are you sure you want to delete this evergreen box?")) {
      deleteMutation.mutate();
    }
  };

  const iconOptions = [
    { value: "lucide-megaphone", label: "Megaphone" },
    { value: "lucide-mail", label: "Mail" },
    { value: "lucide-file-text", label: "Document" },
    { value: "lucide-video", label: "Video" },
    { value: "lucide-image", label: "Image" },
    { value: "lucide-calendar", label: "Calendar" },
    { value: "lucide-users", label: "Users" },
    { value: "lucide-target", label: "Target" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Evergreen Box" : "Create Evergreen Box"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Content box title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this evergreen content requirement"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsible Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Team member responsible" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="waterfallCycleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waterfall Cycle (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select waterfall cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No cycle assigned</SelectItem>
                      {waterfallCycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL/Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <div>
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#7232d9] hover:bg-[#6028c5]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEditing
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}