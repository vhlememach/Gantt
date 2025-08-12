import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Palette, Ungroup, Download, Plus, ExpandIcon, ChevronDown, Settings, CheckSquare } from "lucide-react";

import { Navigation, MobileNavigation } from "@/components/ui/navigation";
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
  const [viewType, setViewType] = useState<"Normal" | "Condensed">("Normal");
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
          // Force visible content and remove scrollbars
          const htmlElement = element as HTMLElement;
          const originalStyles = {
            overflow: htmlElement.style.overflow,
            maxHeight: htmlElement.style.maxHeight,
            height: htmlElement.style.height
          };
          
          // Add temporary export styles to improve text rendering
          const exportStyle = document.createElement('style');
          exportStyle.id = 'export-styles';
          exportStyle.innerHTML = `
            .gantt-container * {
              line-height: 1.6 !important;
              letter-spacing: 0.5px !important;
            }
            .gantt-container .text-sm {
              font-size: 16px !important;
              padding: 4px 8px !important;
            }
            .gantt-container .text-xs {
              font-size: 14px !important;
              padding: 2px 4px !important;
            }
            .gantt-container .font-medium,
            .gantt-container .font-semibold {
              font-weight: 600 !important;
            }
            .gantt-container .rounded-lg {
              border-radius: 8px !important;
            }
            .gantt-container .timeline-bar-content {
              padding: 8px 12px !important;
              display: flex !important;
              align-items: center !important;
              min-height: 40px !important;
            }
          `;
          document.head.appendChild(exportStyle);
          
          // Make everything visible for export
          htmlElement.style.overflow = 'visible';
          htmlElement.style.maxHeight = 'none';
          htmlElement.style.height = 'auto';
          
          // Force layout recalculation
          htmlElement.offsetHeight;
          
          setTimeout(() => {
            html2canvas.default(htmlElement, {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
              width: htmlElement.scrollWidth,
              height: htmlElement.scrollHeight,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              logging: false,
              onclone: (clonedDoc) => {
                // Ensure proper text rendering in cloned document
                const clonedStyle = clonedDoc.createElement('style');
                clonedStyle.innerHTML = exportStyle.innerHTML;
                clonedDoc.head.appendChild(clonedStyle);
              }
            }).then(canvas => {
              // Restore original styles and remove export styles
              Object.assign(htmlElement.style, originalStyles);
              const styleElement = document.getElementById('export-styles');
              if (styleElement) {
                styleElement.remove();
              }
              
              const link = document.createElement('a');
              link.download = `gantt-chart-${new Date().toISOString().split('T')[0]}.png`;
              link.href = canvas.toDataURL('image/png', 1.0);
              link.click();
            }).catch(error => {
              console.error('PNG Export failed:', error);
              Object.assign(htmlElement.style, originalStyles);
              const styleElement = document.getElementById('export-styles');
              if (styleElement) {
                styleElement.remove();
              }
              alert('Export failed. Please try again.');
            });
          }, 1500);
        }).catch(error => {
          console.error('HTML2Canvas load failed:', error);
          alert('Export library failed to load.');
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
          // Force visible content and remove scrollbars
          const htmlElement = element as HTMLElement;
          const originalStyles = {
            overflow: htmlElement.style.overflow,
            maxHeight: htmlElement.style.maxHeight,
            height: htmlElement.style.height
          };
          
          // Add temporary export styles to improve text rendering
          const exportStyle = document.createElement('style');
          exportStyle.id = 'export-styles-pdf';
          exportStyle.innerHTML = `
            .gantt-container * {
              line-height: 1.6 !important;
              letter-spacing: 0.5px !important;
            }
            .gantt-container .text-sm {
              font-size: 16px !important;
              padding: 4px 8px !important;
            }
            .gantt-container .text-xs {
              font-size: 14px !important;
              padding: 2px 4px !important;
            }
            .gantt-container .font-medium,
            .gantt-container .font-semibold {
              font-weight: 600 !important;
            }
            .gantt-container .rounded-lg {
              border-radius: 8px !important;
            }
            .gantt-container .timeline-bar-content {
              padding: 8px 12px !important;
              display: flex !important;
              align-items: center !important;
              min-height: 40px !important;
            }
          `;
          document.head.appendChild(exportStyle);
          
          // Make everything visible for export
          htmlElement.style.overflow = 'visible';
          htmlElement.style.maxHeight = 'none';
          htmlElement.style.height = 'auto';
          
          // Force layout recalculation
          htmlElement.offsetHeight;
          
          setTimeout(() => {
            html2canvas.default(htmlElement, {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
              width: htmlElement.scrollWidth,
              height: htmlElement.scrollHeight,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              logging: false,
              onclone: (clonedDoc) => {
                // Ensure proper text rendering in cloned document
                const clonedStyle = clonedDoc.createElement('style');
                clonedStyle.innerHTML = exportStyle.innerHTML;
                clonedDoc.head.appendChild(clonedStyle);
              }
            }).then(canvas => {
              // Restore original styles and remove export styles
              Object.assign(htmlElement.style, originalStyles);
              const styleElement = document.getElementById('export-styles-pdf');
              if (styleElement) {
                styleElement.remove();
              }
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
          }).catch(error => {
            console.error('PDF Export failed:', error);
            Object.assign(htmlElement.style, originalStyles);
            const styleElement = document.getElementById('export-styles-pdf');
            if (styleElement) {
              styleElement.remove();
            }
            alert('Export failed. Please try again.');
          });
          }, 1500);
        }).catch(error => {
          console.error('Libraries load failed:', error);
          alert('Export libraries failed to load.');
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
            <div className="flex items-center space-x-6">
              <h1 
                className="text-xl font-bold"
                style={{
                  color: settings?.headerTitleColor || '#FFFFFF'
                }}
              >
                {settings?.headerTitle || "Release Gantt Chart"}
              </h1>
              
              {/* Navigation */}
              <div className="hidden md:block">
                <Navigation className="text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/checklist">
                <Button 
                  variant="secondary" 
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Team Checklist
                </Button>
              </Link>
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
            <Button onClick={() => handleReleaseEdit(null)} className="hover:bg-blue-700 bg-[#7232d9]">
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

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700">Type:</label>
              <Select value={viewType} onValueChange={(value: "Normal" | "Condensed") => setViewType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Condensed">Condensed</SelectItem>
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
          viewType={viewType}
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
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
