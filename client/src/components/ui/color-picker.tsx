import { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showInput?: boolean;
}

const presetColors = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
  "#475569", "#334155", "#1e293b", "#0f172a", "#991b1b", "#92400e",
  "#854d0e", "#a16207", "#4d7c0f", "#166534", "#065f46", "#134e4a",
  "#164e63", "#1e40af", "#3730a3", "#581c87", "#7c2d12", "#9f1239",
];

export function ColorPicker({ value, onChange, label = "Color", showInput = true }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-10"
          onClick={() => setIsOpen(true)}
        >
          <div
            className="w-6 h-6 rounded border mr-2 flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          {value}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Color</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preset colors */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Preset Colors
              </label>
              <div className="grid grid-cols-6 gap-2">
                {presetColors.map((color) => (
                  <Button
                    key={color}
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 p-0 border"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Custom color input */}
            {showInput && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Custom Color (Hex)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-12 h-10 border border-slate-200 rounded cursor-pointer"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleColorSelect(customColor)}
                  className="w-full"
                >
                  Apply Custom Color
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}