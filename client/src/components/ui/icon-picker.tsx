import { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { Search } from "lucide-react";
import * as Icons from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

// Common icon categories for better organization
const iconCategories = {
  "Business & Office": [
    "briefcase", "building", "calculator", "calendar", "chart-bar", "chart-line", 
    "clipboard", "database", "file", "folder", "globe", "graph", "pie-chart", 
    "presentation", "printer", "settings", "shield", "target", "trending-up", "users"
  ],
  "Technology": [
    "code", "cpu", "hard-drive", "laptop", "monitor", "mouse", "phone", "router", 
    "server", "smartphone", "tablet", "wifi", "battery", "bluetooth", "camera", 
    "headphones", "keyboard", "microchip", "power", "usb"
  ],
  "Tools & Actions": [
    "cog", "edit", "hammer", "key", "lock", "magic-wand", "refresh", "save", 
    "search", "tool", "trash", "unlock", "wrench", "gear", "screwdriver", 
    "paintbrush", "scissors", "ruler", "compass", "flashlight"
  ],
  "Communication": [
    "mail", "message-circle", "message-square", "phone-call", "send", "share", 
    "video", "voice", "megaphone", "bell", "radio", "satellite", "antenna", 
    "broadcast", "podcast", "volume-2", "headset", "microphone", "speaker", "rss"
  ],
  "Transportation": [
    "car", "truck", "plane", "train", "ship", "bicycle", "bus", "rocket", 
    "helicopter", "motorcycle", "scooter", "taxi", "ambulance", "fire-truck", 
    "police-car", "tractor", "subway", "ferry", "hot-air-balloon", "parachute"
  ],
  "Nature & Science": [
    "tree", "leaf", "flower", "sun", "moon", "star", "cloud", "lightning", 
    "snowflake", "droplets", "flame", "atom", "dna", "microscope", "telescope", 
    "beaker", "flask", "test-tube", "magnet", "thermometer"
  ]
};

export function IconPicker({ value, onChange, label = "Icon" }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Business & Office");

  // Get all available Lucide icons
  const allIcons = Object.keys(Icons).filter(name => 
    name !== "default" && 
    typeof Icons[name as keyof typeof Icons] === "function"
  );

  // Filter icons based on search term and category
  const filteredIcons = searchTerm 
    ? allIcons.filter(icon => 
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : iconCategories[selectedCategory as keyof typeof iconCategories] || [];

  const handleIconSelect = (iconName: string) => {
    onChange(`lucide-${iconName}`);
    setIsOpen(false);
  };

  // Convert value back to icon name for display
  const currentIconName = value?.replace("lucide-", "") || "box";
  const IconComponent = Icons[currentIconName as keyof typeof Icons] as React.ComponentType<any>;

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => setIsOpen(true)}
        >
          {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
          {currentIconName}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose an Icon</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category tabs */}
            {!searchTerm && (
              <div className="flex flex-wrap gap-2">
                {Object.keys(iconCategories).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}

            {/* Icon grid */}
            <ScrollArea className="h-96">
              <div className="grid grid-cols-8 gap-2 p-2">
                {filteredIcons.slice(0, 64).map((iconName) => {
                  const IconComp = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
                  return IconComp ? (
                    <Button
                      key={iconName}
                      variant="ghost"
                      size="sm"
                      className="h-12 w-12 p-0"
                      onClick={() => handleIconSelect(iconName)}
                      title={iconName}
                    >
                      <IconComp className="h-5 w-5" />
                    </Button>
                  ) : null;
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}