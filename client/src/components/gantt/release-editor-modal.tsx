import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays } from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Release, ReleaseGroup } from "@shared/schema";

interface ReleaseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: string | null;
}

export default function ReleaseEditorModal({ isOpen, onClose, releaseId }: ReleaseEditorModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    groupId: "",
    startDate: "",
    endDate: "",
    icon: "lucide-rocket",
    responsible: "",
    status: "upcoming",
  });

  // Debug logging for modal props
  console.log('ReleaseEditorModal render:', { isOpen, releaseId });

  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
    enabled: isOpen,
  });

  const { data: release, isLoading: releaseLoading, error: releaseError } = useQuery<Release>({
    queryKey: ["/api/releases", releaseId],
    enabled: isOpen && !!releaseId,
  });

  // Debug logging for query state
  console.log('Query state:', { 
    releaseId, 
    hasRelease: !!release, 
    releaseLoading, 
    releaseError,
    release: release ? { id: release.id, name: release.name } : null,
    isQueryEnabled: isOpen && !!releaseId 
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        description: "",
        url: "",
        groupId: "",
        startDate: "",
        endDate: "",
        icon: "lucide-rocket",
        responsible: "",
        status: "upcoming",
      });
    }
  }, [isOpen]);

  // Populate form when editing existing release
  useEffect(() => {
    console.log('Form population effect:', { 
      isOpen, 
      releaseId, 
      hasRelease: !!release, 
      releaseLoading,
      releaseError,
      canPopulate: isOpen && releaseId && release && !releaseLoading
    });
    
    if (isOpen && releaseId && release && !releaseLoading) {
      console.log('Populating form with release data:', release);
      setFormData({
        name: release.name || "",
        description: release.description || "",
        url: release.url || "",
        groupId: release.groupId || "",
        startDate: release.startDate ? new Date(release.startDate).toISOString().split('T')[0] : "",
        endDate: release.endDate ? new Date(release.endDate).toISOString().split('T')[0] : "",
        icon: release.icon || "lucide-rocket",
        responsible: release.responsible || "",
        status: release.status || "upcoming",
      });
    }
  }, [isOpen, releaseId, release, releaseLoading, releaseError]);

  // Set defaults for new release
  useEffect(() => {
    if (isOpen && !releaseId && groups.length > 0) {
      console.log('Setting form defaults for new release');
      setFormData({
        name: "",
        description: "",
        url: "",
        groupId: groups[0].id,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: "lucide-rocket",
        responsible: "",
        status: "upcoming",
      });
    }
  }, [isOpen, releaseId, groups]);

  const createReleaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Creating release with form data:', data);
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        description: data.description || "",
        url: data.url || "",
        responsible: data.responsible || "",
      };
      console.log('Sending payload:', payload);
      const response = await apiRequest("POST", "/api/releases", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      queryClient.refetchQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Release created successfully" });
      setFormData({
        name: "",
        description: "",
        groupId: groups[0]?.id || "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        icon: "lucide-rocket",
        responsible: "",
        status: "upcoming",
      });
      onClose();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({ title: "Failed to create release", variant: "destructive" });
    },
  });

  const updateReleaseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Updating release with form data:', data);
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        description: data.description || "",
        url: data.url || "",
        responsible: data.responsible || "",
      };
      console.log('Sending update payload:', payload);
      const response = await apiRequest("PUT", `/api/releases/${releaseId}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases", releaseId] });
      queryClient.refetchQueries({ queryKey: ["/api/releases"] });
      toast({ title: "Release updated successfully" });
      onClose();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: "Failed to update release", variant: "destructive" });
    },
  });



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

  // No need for IconComponent anymore - handled by IconPicker

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
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the release..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="url">Project URL (optional)</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://docs.example.com/project-info"
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

          <IconPicker
            label="Icon"
            value={formData.icon}
            onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
          />

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
