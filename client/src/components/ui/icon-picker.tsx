import { useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { 
  Search, Box,
  Briefcase, Building, Calculator, Calendar, BarChart3, LineChart, 
  Clipboard, Database, File, Folder, Globe, TrendingUp, Users, 
  Settings, Shield, Target, PieChart, FileText, FolderOpen, Archive,
  Code, Cpu, HardDrive, Laptop, Monitor, Mouse, Phone, Router, 
  Server, Smartphone, Tablet, Wifi, Battery, Bluetooth, Camera, 
  Headphones, Keyboard, Zap, Power, Usb,
  Edit, Hammer, Key, Lock, Wand2, RefreshCw, Save, 
  Wrench, Trash, Unlock, Paintbrush, Scissors, Ruler, 
  Navigation, Flashlight, Cog,
  Mail, MessageCircle, MessageSquare, PhoneCall, Send, Share2, 
  Video, Mic, Megaphone, Bell, Radio, Satellite, Rss,
  Volume2, Headset, Speaker, MessageSquareMore, AtSign, Hash,
  Car, Truck, Plane, Train, Ship, Bike, Bus, Rocket, 
  PlaneTakeoff, PlaneLanding, MapPin, Map, Compass, 
  Route, Navigation2, Move, ArrowRight, ArrowUp, ArrowDown,
  TreePine, Leaf, Flower, Sun, Moon, Star, Cloud, 
  Snowflake, Droplets, Flame, Atom, Dna, Microscope, Telescope, 
  TestTube, Magnet, Thermometer, Wind
} from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

// Common icon categories using actual Lucide icon names
const iconCategories = {
  "Business & Office": [
    "Briefcase", "Building", "Calculator", "Calendar", "BarChart3", "LineChart", 
    "Clipboard", "Database", "File", "Folder", "Globe", "TrendingUp", "Users", 
    "Settings", "Shield", "Target", "PieChart", "FileText", "FolderOpen", "Archive"
  ],
  "Technology": [
    "Code", "Cpu", "HardDrive", "Laptop", "Monitor", "Mouse", "Phone", "Router", 
    "Server", "Smartphone", "Tablet", "Wifi", "Battery", "Bluetooth", "Camera", 
    "Headphones", "Keyboard", "Zap", "Power", "Usb"
  ],
  "Tools & Actions": [
    "Settings", "Edit", "Hammer", "Key", "Lock", "Wand2", "RefreshCw", "Save", 
    "Search", "Wrench", "Trash", "Unlock", "Paintbrush", "Scissors", "Ruler", 
    "Navigation", "Flashlight", "Cog"
  ],
  "Communication": [
    "Mail", "MessageCircle", "MessageSquare", "PhoneCall", "Send", "Share2", 
    "Video", "Mic", "Megaphone", "Bell", "Radio", "Satellite", "Rss",
    "Volume2", "Headset", "Speaker", "MessageSquareMore", "AtSign", "Hash"
  ],
  "Transportation": [
    "Car", "Truck", "Plane", "Train", "Ship", "Bike", "Bus", "Rocket", 
    "PlaneTakeoff", "PlaneLanding", "MapPin", "Map", "Compass", 
    "Route", "Navigation2", "Move", "ArrowRight", "ArrowUp", "ArrowDown"
  ],
  "Nature & Science": [
    "TreePine", "Leaf", "Flower", "Sun", "Moon", "Star", "Cloud", 
    "Snowflake", "Droplets", "Flame", "Atom", "Dna", "Microscope", "Telescope", 
    "TestTube", "Magnet", "Thermometer", "Wind"
  ]
};

// Create icon map for easier access
const iconMap: Record<string, React.ComponentType<any>> = {
  Box, Briefcase, Building, Calculator, Calendar, BarChart3, LineChart, 
  Clipboard, Database, File, Folder, Globe, TrendingUp, Users, 
  Settings, Shield, Target, PieChart, FileText, FolderOpen, Archive,
  Code, Cpu, HardDrive, Laptop, Monitor, Mouse, Phone, Router, 
  Server, Smartphone, Tablet, Wifi, Battery, Bluetooth, Camera, 
  Headphones, Keyboard, Zap, Power, Usb,
  Edit, Hammer, Key, Lock, Wand2, RefreshCw, Save, 
  Wrench, Trash, Unlock, Paintbrush, Scissors, Ruler, 
  Navigation, Flashlight, Cog,
  Mail, MessageCircle, MessageSquare, PhoneCall, Send, Share2, 
  Video, Mic, Megaphone, Bell, Radio, Satellite, Rss,
  Volume2, Headset, Speaker, MessageSquareMore, AtSign, Hash,
  Car, Truck, Plane, Train, Ship, Bike, Bus, Rocket, 
  PlaneTakeoff, PlaneLanding, MapPin, Map, Compass, 
  Route, Navigation2, Move, ArrowRight, ArrowUp, ArrowDown,
  TreePine, Leaf, Flower, Sun, Moon, Star, Cloud, 
  Snowflake, Droplets, Flame, Atom, Dna, Microscope, Telescope, 
  TestTube, Magnet, Thermometer, Wind
};

export function IconPicker({ value, onChange, label = "Icon" }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Business & Office");

  // Get all available icon names
  const allIconNames = Object.keys(iconMap);

  // Filter icons based on search term and category
  const filteredIcons = searchTerm 
    ? allIconNames.filter(icon => 
        icon.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : iconCategories[selectedCategory as keyof typeof iconCategories] || [];

  const handleIconSelect = (iconName: string) => {
    onChange(`lucide-${iconName}`);
    setIsOpen(false);
  };

  // Convert value back to icon name for display
  const currentIconName = value?.replace("lucide-", "") || "Box";
  const IconComponent = iconMap[currentIconName] || Box;

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
          <IconComponent className="mr-2 h-4 w-4" />
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
                {filteredIcons.length === 0 && (
                  <div className="col-span-8 text-center text-gray-500 py-8">
                    No icons found. Try a different search or category.
                  </div>
                )}
                {filteredIcons.slice(0, 64).map((iconName) => {
                  const IconComp = iconMap[iconName];
                  const isSelected = currentIconName === iconName;
                  return IconComp ? (
                    <Button
                      key={iconName}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={`h-12 w-12 p-0 ${isSelected ? 'ring-2 ring-primary' : ''}`}
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