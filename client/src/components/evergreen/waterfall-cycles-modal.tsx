import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, FileText, MessageSquare, Video, Palette, Image, Users } from "lucide-react";
import type { WaterfallCycle, InsertWaterfallCycle } from "@shared/schema";
import { insertWaterfallCycleSchema } from "@shared/schema";
import FormatAssignmentsModal from "./format-assignments-modal";

const formSchema = insertWaterfallCycleSchema.extend({
  name: z.string().min(1, "Name is required"),
  contentRequirements: z.record(z.number().min(0)),
});

interface WaterfallCyclesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaterfallCyclesModal({ isOpen, onClose }: WaterfallCyclesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCycle, setEditingCycle] = useState<string | null>(null);
  const [isFormatAssignmentsOpen, setIsFormatAssignmentsOpen] = useState(false);

  // Fetch waterfall cycles
  const { data: cycles = [], isLoading } = useQuery<WaterfallCycle[]>({
    queryKey: ["/api/waterfall-cycles"],
    enabled: isOpen,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      contentRequirements: {
        article: 0,
        thread: 0,
        video: 0,
        animation: 0,
        visual: 0,
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertWaterfallCycle) => {
      const response = await fetch("/api/waterfall-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waterfall-cycles"] });
      toast({ title: "Waterfall cycle created successfully" });
      setIsCreating(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create waterfall cycle", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWaterfallCycle> }) => {
      const response = await fetch(`/api/waterfall-cycles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waterfall-cycles"] });
      toast({ title: "Waterfall cycle updated successfully" });
      setEditingCycle(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update waterfall cycle", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/waterfall-cycles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waterfall-cycles"] });
      toast({ title: "Waterfall cycle deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete waterfall cycle", variant: "destructive" });
    },
  });

  const handleEdit = (cycle: WaterfallCycle) => {
    setEditingCycle(cycle.id);
    setIsCreating(false);
    form.reset({
      name: cycle.name,
      description: cycle.description || "",
      contentRequirements: cycle.contentRequirements as Record<string, number>,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this waterfall cycle?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingCycle) {
      updateMutation.mutate({ id: editingCycle, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCycle(null);
    form.reset();
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "article": return <FileText className="h-4 w-4" />;
      case "thread": return <MessageSquare className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "animation": return <Palette className="h-4 w-4" />;
      case "visual": return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Waterfall Cycles</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="cycles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cycles">Waterfall Cycles</TabsTrigger>
            <TabsTrigger value="assignments">Format Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cycles" className="space-y-6">
          {/* Create/Edit Form */}
          {(isCreating || editingCycle) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCycle ? "Edit Waterfall Cycle" : "Create New Waterfall Cycle"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Cycle name" {...field} />
                            </FormControl>
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
                            <Textarea placeholder="Describe this waterfall cycle" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel className="text-base font-medium">Content Requirements</FormLabel>
                      <div className="grid grid-cols-5 gap-4 mt-3">
                        {["article", "thread", "video", "animation", "visual"].map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name={`contentRequirements.${type}` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2 capitalize">
                                  {getContentIcon(type)}
                                  <span>{type}</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-[#7232d9] hover:bg-[#6028c5]"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Saving..."
                          : editingCycle
                          ? "Update"
                          : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Add New Button */}
          {!isCreating && !editingCycle && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-[#7232d9] hover:bg-[#6028c5]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Waterfall Cycle
            </Button>
          )}

          <Separator />

          {/* Existing Cycles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Waterfall Cycles</h3>
            {isLoading ? (
              <div className="text-center py-8">Loading cycles...</div>
            ) : cycles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No waterfall cycles created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {cycles.map((cycle) => (
                  <Card key={cycle.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{cycle.name}</CardTitle>
                          {cycle.description && (
                            <CardDescription className="mt-1">
                              {cycle.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cycle)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cycle.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(cycle.contentRequirements as Record<string, number>).map(([type, count]) => (
                          count > 0 && (
                            <Badge key={type} variant="secondary" className="flex items-center space-x-1">
                              {getContentIcon(type)}
                              <span className="capitalize">{type}</span>
                              <span className="bg-gray-200 text-gray-800 px-1 rounded text-xs ml-1">
                                {count}
                              </span>
                            </Badge>
                          )
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          </TabsContent>
          
          <TabsContent value="assignments" className="space-y-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content Format Assignments</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manage which team members are responsible for each content format type.
              </p>
              <Button
                onClick={() => setIsFormatAssignmentsOpen(true)}
                className="bg-[#7232d9] hover:bg-[#6028c5]"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Team Assignments
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <FormatAssignmentsModal
          isOpen={isFormatAssignmentsOpen}
          onClose={() => setIsFormatAssignmentsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}