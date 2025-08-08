import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, Database, Rocket, Settings, TrendingUp, Smartphone, Cloud } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Release, ReleaseGroup } from "@shared/schema";

interface ReleaseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: string | null;
}

const iconOptions = [
  { value: "fas fa-database", icon: Database, label: "Database" },
  { value: "fas fa-rocket", icon: Rocket, label: "Rocket" },
  { value: "fas fa-cog", icon: Settings, label: "Settings" },
  { value: "fas fa-chart-line", icon: TrendingUp, label: "Chart" },
  { value: "fas fa-mobile-alt", icon: Smartphone, label: "Mobile" },
  { value: "fas fa-cloud", icon: Cloud, label: "Cloud" },
];

export default function ReleaseEditorModal({ isOpen, onClose, releaseId }: ReleaseEditorModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupId: "",
    startDate: "",
    endDate: "",
    icon: "fas fa-rocket",
    responsible: "",
    status: "upcoming",
  });

  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
    enabled: isOpen,
  });

  const { data: release } = useQuery<Release>({
    queryKey: ["/api/releases", releaseId],
    enabled: isOpen && !!releaseId,
  });

  // Populate form when release data is loaded
  useEffect(() => {
    if (release) {
      setFormData({
        name: release.name || "",
        description: release.description || "",
        groupId: release.groupId || "",
        startDate: release.startDate ? new Date(release.startDate).toISOString().split('T')[0] : "",
        endDate: release.endDate ? new Date(release.endDate).toISOString().split('T')[0] : "",
        icon: release.icon || "fas fa-rocket",
        responsible: release.responsible || "",
        status: release.status || "upcoming",
      });
    } else if (!releaseId) {
      // Reset form for new release
      setFormData({
        name: "",
        description: "",
        groupId: groups[0]?.id || "",
        startDate: "",
        endDate: "",
        icon: "fas fa-rocket",
        responsible: "",
        status: "upcoming",
      });
    }
  }, [release, releaseId, groups.length]);

  const createReleaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/releases", {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Release created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create release", variant: "destructive" });
    },
  });

  const updateReleaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", `/api/releases/${releaseId}`, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Release updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update release", variant: "destructive" });
    },
  });

  // Initialize form data when release is loaded or when creating new
  useEffect(() => {
    if (release) {
      setFormData({
        name: release.name,
        description: release.description || "",
        groupId: release.groupId,
        startDate: new Date(release.startDate).toISOString().split('T')[0],
        endDate: new Date(release.endDate).toISOString().split('T')[0],
        icon: release.icon,
        responsible: release.responsible || "",
        status: release.status || "upcoming",
      });
    } else if (isOpen && !releaseId) {
      // Reset form for new release
      setFormData({
        name: "",
        description: "",
        groupId: groups[0]?.id || "",
        startDate: "",
        endDate: "",
        icon: "fas fa-rocket",
        responsible: "",
        status: "upcoming",
      });
    }
  }, [release, isOpen, releaseId, groups]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.groupId || !formData.startDate || !formData.endDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }

    if (releaseId) {
      updateReleaseMutation.mutate(formData);
    } else {
      createReleaseMutation.mutate(formData);
    }
  };

  const IconComponent = iconOptions.find(opt => opt.value === formData.icon)?.icon || Rocket;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{releaseId ? "Edit Release" : "Add Release"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Release Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Data Lake v2"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the release"
            />
          </div>

          <div>
            <Label htmlFor="responsible">Responsible Person</Label>
            <Input
              id="responsible"
              value={formData.responsible}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
              placeholder="e.g., Sarah Johnson"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="groupId">Group</Label>
              <Select value={formData.groupId} onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        <span>{group.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.icon === option.value ? "default" : "outline"}
                    className="w-10 h-10 p-0"
                    onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createReleaseMutation.isPending || updateReleaseMutation.isPending}
            >
              {releaseId ? "Update Release" : "Create Release"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
