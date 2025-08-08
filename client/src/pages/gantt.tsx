import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Palette, Ungroup, Download, Plus, ExpandIcon } from "lucide-react";
import HeaderCustomizationModal from "@/components/gantt/header-customization-modal";
import GroupManagementModal from "@/components/gantt/group-management-modal";
import ReleaseEditorModal from "@/components/gantt/release-editor-modal";
import GanttChart from "@/components/gantt/gantt-chart";
import type { AppSettings } from "@shared/schema";

export default function GanttPage() {
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("Quarters");
  const [zoomLevel, setZoomLevel] = useState([100]);

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const handleReleaseEdit = (releaseId: string | null) => {
    setSelectedReleaseId(releaseId);
    setIsReleaseModalOpen(true);
  };

  const headerStyle = settings ? {
    background: `linear-gradient(135deg, ${settings.headerBackgroundColor}, ${settings.buttonColor})`,
    fontFamily: settings.fontFamily,
  } : {};

  return (
    <div className="min-h-screen bg-slate-50 font-inter flex flex-col">
      {/* Header */}
      <header className="text-white shadow-lg" style={headerStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">
                {settings?.headerTitle || "Release Gantt Chart"}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsGroupModalOpen(true)}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
              >
                <Ungroup className="mr-2 h-4 w-4" />
                Manage Groups
              </Button>
              <Button
                onClick={() => setIsHeaderModalOpen(true)}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
              >
                <Palette className="mr-2 h-4 w-4" />
                Customize
              </Button>
              <Button
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Controls */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={() => handleReleaseEdit(null)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Release
            </Button>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">View:</label>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarters">Quarters</SelectItem>
                  <SelectItem value="Months">Months</SelectItem>
                  <SelectItem value="Weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Zoom:</label>
              <Slider
                value={zoomLevel}
                onValueChange={setZoomLevel}
                max={200}
                min={50}
                step={10}
                className="w-24"
              />
              <span className="text-sm text-slate-500 w-12">{zoomLevel[0]}%</span>
            </div>
            <Button variant="ghost" size="sm">
              <ExpandIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <GanttChart 
          zoomLevel={zoomLevel[0]} 
          viewMode={viewMode} 
          onReleaseEdit={handleReleaseEdit}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-slate-600">
            <span>Total Releases: <strong>5</strong></span>
            <span>Active Groups: <strong>2</strong></span>
            <span>Timeline: <strong>Jan 2024 - Jul 2024</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span>Click and drag to resize bars • Double-click to edit</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <HeaderCustomizationModal 
        isOpen={isHeaderModalOpen} 
        onClose={() => setIsHeaderModalOpen(false)} 
      />
      <GroupManagementModal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
      />
      <ReleaseEditorModal 
        isOpen={isReleaseModalOpen} 
        onClose={() => setIsReleaseModalOpen(false)}
        releaseId={selectedReleaseId}
      />
    </div>
  );
}
