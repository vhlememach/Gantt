import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ReleaseGroup } from "@shared/schema";



interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupManagementModal({ isOpen, onClose }: GroupManagementModalProps) {
  const { toast } = useToast();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#3B82F6");
  const [expandedGradients, setExpandedGradients] = useState<Set<string>>(new Set());

  const { data: groups = [], isLoading } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
    enabled: isOpen,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; gradientEnabled?: string; gradientSecondaryColor?: string }) => {
      const response = await apiRequest("POST", "/api/release-groups", {
        ...data,
        gradientEnabled: data.gradientEnabled || "true",
        gradientSecondaryColor: data.gradientSecondaryColor || "#FFFFFF"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/release-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      setNewGroupName("");
      setNewGroupColor("#3B82F6");
      toast({ title: "Group created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create group", variant: "destructive" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { color?: string; name?: string; gradientEnabled?: string; gradientSecondaryColor?: string } }) => {
      const response = await apiRequest("PUT", `/api/release-groups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/release-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Group updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update group", variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/release-groups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/release-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Group deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete group", variant: "destructive" });
    },
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      color: newGroupColor,
    });
  };

  const handleColorChange = (groupId: string, color: string) => {
    updateGroupMutation.mutate({ id: groupId, data: { color } });
  };

  const handleNameChange = (groupId: string, name: string) => {
    updateGroupMutation.mutate({ id: groupId, data: { name } });
  };

  const handleGradientToggle = (groupId: string, enabled: boolean) => {
    updateGroupMutation.mutate({ id: groupId, data: { gradientEnabled: enabled.toString() } });
  };

  const handleGradientSecondaryColor = (groupId: string, color: string) => {
    updateGroupMutation.mutate({ id: groupId, data: { gradientSecondaryColor: color } });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? All releases in this group will also be deleted.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const toggleGradientExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGradients);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGradients(newExpanded);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Release Groups</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-slate-500">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-slate-500">No groups created yet</div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                {/* Group Name and Color */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ 
                        background: group.gradientEnabled === "true" 
                          ? `linear-gradient(135deg, ${group.color}, ${group.gradientSecondaryColor || '#FFFFFF'})`
                          : group.color 
                      }}
                    />
                    <Input
                      value={group.name}
                      onChange={(e) => handleNameChange(group.id, e.target.value)}
                      className="flex-1 bg-transparent border-none shadow-none p-0 font-medium text-slate-700 focus:bg-white focus:border focus:shadow-sm focus:px-2 focus:py-1"
                      onBlur={(e) => {
                        if (e.target.value.trim() !== group.name) {
                          handleNameChange(group.id, e.target.value.trim() || group.name);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={group.color}
                      onChange={(e) => handleColorChange(group.id, e.target.value)}
                      className="w-8 h-8 border border-slate-300 rounded cursor-pointer"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Gradient Controls */}
                <div className="pl-7 border-l-2 border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm text-slate-600">Gradient Shading</Label>
                      <button
                        onClick={() => toggleGradientExpanded(group.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {expandedGradients.has(group.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <Switch
                      checked={group.gradientEnabled === "true"}
                      onCheckedChange={(enabled) => handleGradientToggle(group.id, enabled)}
                    />
                  </div>
                  
                  {group.gradientEnabled === "true" && expandedGradients.has(group.id) && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm text-slate-600">Primary Color</Label>
                          <input
                            type="color"
                            value={group.color}
                            onChange={(e) => handleColorChange(group.id, e.target.value)}
                            className="w-full h-8 border border-slate-300 rounded cursor-pointer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-slate-600">Secondary Color</Label>
                          <input
                            type="color"
                            value={group.gradientSecondaryColor || '#FFFFFF'}
                            onChange={(e) => handleGradientSecondaryColor(group.id, e.target.value)}
                            className="w-full h-8 border border-slate-300 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500">Preview:</div>
                        <div 
                          className="h-6 rounded border"
                          style={{ 
                            background: `linear-gradient(135deg, ${group.color}, ${group.gradientSecondaryColor || '#FFFFFF'})`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4">
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="flex items-center space-x-3">
              <Input
                placeholder="New group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-10 h-10 border border-slate-300 rounded cursor-pointer"
              />
              <Button 
                type="submit" 
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
