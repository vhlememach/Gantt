import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AppSettings } from "@shared/schema";

interface HeaderCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HeaderCustomizationModal({ isOpen, onClose }: HeaderCustomizationModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    headerTitle: "",
    headerBackgroundColor: "",
    fontFamily: "",
    buttonColor: "",
    buttonStyle: "",
  });

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    enabled: isOpen,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AppSettings>) => {
      const response = await apiRequest("PUT", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        headerTitle: settings.headerTitle,
        headerBackgroundColor: settings.headerBackgroundColor,
        fontFamily: settings.fontFamily,
        buttonColor: settings.buttonColor,
        buttonStyle: settings.buttonStyle,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Header</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="headerTitle">Header Title</Label>
            <Input
              id="headerTitle"
              value={formData.headerTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, headerTitle: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="headerBackgroundColor">Background Color</Label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={formData.headerBackgroundColor}
                onChange={(e) => setFormData(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
              />
              <Input
                value={formData.headerBackgroundColor}
                onChange={(e) => setFormData(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select value={formData.fontFamily} onValueChange={(value) => setFormData(prev => ({ ...prev, fontFamily: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="buttonColor">Button Style</Label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={formData.buttonColor}
                onChange={(e) => setFormData(prev => ({ ...prev, buttonColor: e.target.value }))}
                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
              />
              <Select value={formData.buttonStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, buttonStyle: value }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
