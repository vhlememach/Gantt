import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColorPicker } from "@/components/ui/color-picker";
import { Palette } from "lucide-react";

interface StatusColorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultStatusColors = {
  upcoming: "#f59e0b", // yellow
  "in-progress": "#3b82f6", // blue
  completed: "#22c55e", // green
  delayed: "#ef4444", // red
};

export default function StatusColorSettings({ isOpen, onClose }: StatusColorSettingsProps) {
  const [statusColors, setStatusColors] = useState(() => {
    const saved = localStorage.getItem("gantt-status-colors");
    return saved ? JSON.parse(saved) : defaultStatusColors;
  });

  const handleColorChange = (status: string, color: string) => {
    const newColors = { ...statusColors, [status]: color };
    setStatusColors(newColors);
    localStorage.setItem("gantt-status-colors", JSON.stringify(newColors));
    
    // Update CSS custom properties for immediate effect
    document.documentElement.style.setProperty(`--status-${status}`, color);
  };

  const resetToDefaults = () => {
    setStatusColors(defaultStatusColors);
    localStorage.removeItem("gantt-status-colors");
    
    // Reset CSS custom properties
    Object.entries(defaultStatusColors).forEach(([status, color]) => {
      document.documentElement.style.setProperty(`--status-${status}`, color);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Status Color Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Customize the colors used for different release statuses.
          </p>

          {Object.entries(statusColors).map(([status, color]) => (
            <ColorPicker
              key={status}
              label={`${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}`}
              value={color}
              onChange={(newColor) => handleColorChange(status, newColor)}
            />
          ))}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex-1"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}