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
  const { data: box } = useQuery<EvergreenBox>({
    queryKey: ["/api/evergreen-boxes", boxId],
    enabled: isEditing && isOpen,
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
      waterfallCycleId: "",
    },
  });

  // Reset form when box data loads
  useEffect(() => {
    if (box && isEditing) {
      form.reset({
        title: box.title,
        description: box.description || "",
        groupId: box.groupId,
        responsible: box.responsible || "",
        icon: box.icon,
        waterfallCycleId: box.waterfallCycleId || "",
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        description: "",
        groupId: "",
        responsible: "",
        icon: "lucide-megaphone",
        waterfallCycleId: "",
      });
    }
  }, [box, isEditing, form]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes", boxId] });
      toast({ title: "Evergreen box updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update evergreen box", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/evergreen-boxes/${boxId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evergreen-boxes"] });
      toast({ title: "Evergreen box deleted successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to delete evergreen box", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select waterfall cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No cycle assigned</SelectItem>
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