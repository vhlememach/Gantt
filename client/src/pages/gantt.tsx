import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Palette, Ungroup, Download, Plus, ExpandIcon, ChevronDown, Settings } from "lucide-react";
import HeaderCustomizationModal from "@/components/gantt/header-customization-modal";
import GroupManagementModal from "@/components/gantt/group-management-modal";
import ReleaseEditorModal from "@/components/gantt/release-editor-modal";
import StatusColorSettings from "@/components/gantt/status-color-settings";
import GanttChart from "@/components/gantt/gantt-chart";
import type { AppSettings } from "@shared/schema";

export default function GanttPage() {
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("Quarters");
  const [zoomLevel, setZoomLevel] = useState([100]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isStatusColorModalOpen, setIsStatusColorModalOpen] = useState(false);

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const handleReleaseEdit = (releaseId: string | null) => {
    console.log('handleReleaseEdit called with:', releaseId);
    setSelectedReleaseId(releaseId);
    setIsReleaseModalOpen(true);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      });
    }
  };

  const handleExport = (format: 'json' | 'png' | 'pdf' = 'json') => {
    if (format === 'json') {
      const data = {
        settings,
        groups: [], // This would be populated from the groups query
        releases: [], // This would be populated from the releases query
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gantt-chart-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      // Export as PNG using html2canvas
      const element = document.querySelector('.gantt-container');
      if (element) {
        import('html2canvas').then(html2canvas => {
          html2canvas.default(element as HTMLElement, {
            scale: 2, // Higher resolution for better text quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            height: element.scrollHeight,
            width: element.scrollWidth,
            scrollX: 0,
            scrollY: 0,
            letterRendering: true, // Better text rendering
            logging: false
          }).then(canvas => {
            const link = document.createElement('a');
            link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
          });
        });
      }
    } else if (format === 'pdf') {
      // Export as PDF using jsPDF
      const element = document.querySelector('.gantt-container');
      if (element) {
        Promise.all([
          import('html2canvas'),
          import('jspdf')
        ]).then(([html2canvas, jsPDF]) => {
          html2canvas.default(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            height: element.scrollHeight,
            width: element.scrollWidth,
            scrollX: 0,
            scrollY: 0,
            letterRendering: true,
            logging: false
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF.jsPDF();
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            
            pdf.save(`gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`);
          });
        });
      }
    }
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
              <h1 
                className="text-xl font-bold"
                style={{
                  color: settings?.headerTitleColor || '#FFFFFF'
                }}
              >
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
                onClick={() => setIsStatusColorModalOpen(true)}
                variant="secondary"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
              >
                <Settings className="mr-2 h-4 w-4" />
                Status Colors
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('png')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <Button variant="ghost" size="sm" onClick={toggleFullScreen}>
              <ExpandIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden gantt-container">
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
            <span>Timeline: <strong>Jan 2025 - Jul 2025</strong></span>
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
      <StatusColorSettings
        isOpen={isStatusColorModalOpen}
        onClose={() => setIsStatusColorModalOpen(false)}
      />
    </div>
  );
}
