import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronDown, ChevronRight,
  Rocket, Box,
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
  Car, Truck, Plane, Train, Ship, Bike, Bus, 
  PlaneTakeoff, PlaneLanding, MapPin, Map, Compass, 
  Route, Navigation2, Move, ArrowRight, ArrowUp, ArrowDown,
  TreePine, Leaf, Flower, Sun, Moon, Star, Cloud, 
  Snowflake, Droplets, Flame, Atom, Dna, Microscope, Telescope, 
  TestTube, Magnet, Thermometer, Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TimelineBar from "./timeline-bar.tsx";
import type { ReleaseGroup, Release } from "@shared/schema";

interface GanttChartProps {
  zoomLevel: number;
  viewMode: string;
  viewType: "Normal" | "Condensed";
  onReleaseEdit: (releaseId: string) => void;
}

export default function GanttChart({ zoomLevel, viewMode, viewType, onReleaseEdit }: GanttChartProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
  });

  const { data: releases = [], refetch: refetchReleases } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Add effect to ensure fresh data
  useEffect(() => {
    refetchReleases();
  }, [refetchReleases]);

  // Group releases by group
  const releasesByGroup = groups.map(group => ({
    group,
    releases: releases.filter(release => release.groupId === group.id),
  }));

  // Debug logging
  useEffect(() => {
    console.log('GanttChart data updated:', {
      groupsCount: groups.length,
      releasesCount: releases.length,
      releasesByGroup: releasesByGroup.map(({ group, releases }) => ({
        groupName: group.name,
        releaseCount: releases.length,
        releases: releases.map(r => ({ name: r.name, id: r.id }))
      }))
    });
  }, [groups, releases, releasesByGroup]);

  // Generate timeline based on view mode and actual release dates
  const getTimelineData = (mode: string) => {
    // Find the date range from all releases
    const allDates = releases.flatMap(release => [
      new Date(release.startDate),
      new Date(release.endDate)
    ]);

    if (allDates.length === 0) {
      // Default to current year if no releases
      const currentYear = new Date().getFullYear();
      if (mode === "Quarters") {
        return {
          labels: [`Q1 ${currentYear}`, `Q2 ${currentYear}`, `Q3 ${currentYear}`, `Q4 ${currentYear}`],
          sublabels: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"]
        };
      } else if (mode === "Months") {
        return {
          labels: [`Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`],
          sublabels: ["Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4"]
        };
      } else {
        return {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
          sublabels: ["Days 1-7", "Days 8-14", "Days 15-21", "Days 22-28", "Days 29-35", "Days 36-42"]
        };
      }
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    if (mode === "Quarters") {
      const startYear = minDate.getFullYear();
      const endYear = maxDate.getFullYear();
      const labels = [];
      const sublabels = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];
      
      for (let year = startYear; year <= endYear; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          labels.push(`Q${quarter} ${year}`);
        }
      }
      
      return {
        labels: labels.slice(0, Math.min(16, labels.length)), // Allow more quarters for extended timelines
        sublabels: Array(labels.slice(0, Math.min(16, labels.length)).length).fill(0).map((_, i) => sublabels[i % 4])
      };
    } else if (mode === "Months") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const labels = [];
      
      let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      
      while (currentDate <= endDate && labels.length < 24) {
        labels.push(`${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      return {
        labels,
        sublabels: Array(labels.length).fill("Week 1-4")
      };
    } else { // Weeks
      const labels = [];
      const sublabels = [];
      
      let currentDate = new Date(minDate);
      currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week
      
      let weekCounter = 1;
      while (currentDate <= maxDate && weekCounter <= 52) { // Allow up to 52 weeks for full year coverage
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        labels.push(`Week ${weekCounter}`);
        sublabels.push(`${currentDate.getMonth() + 1}/${currentDate.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`);
        
        currentDate.setDate(currentDate.getDate() + 7);
        weekCounter++;
      }
      
      return { labels, sublabels };
    }
  };

  const timelineData = getTimelineData(viewMode);

  // Calculate current day position for the vertical line
  const getCurrentDayPosition = () => {
    if (releases.length === 0) return 0;
    
    const today = new Date();
    const allDates = releases.flatMap(release => [
      new Date(release.startDate),
      new Date(release.endDate)
    ]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    if (today < minDate || today > maxDate) return -1; // Outside visible range
    
    const totalDuration = maxDate.getTime() - minDate.getTime();
    const currentPosition = (today.getTime() - minDate.getTime()) / totalDuration;
    return currentPosition * 100; // Return as percentage
  };

  const currentDayPosition = getCurrentDayPosition();

  return (
    <div className="flex h-full">
      {/* Left Panel - Release List */}
      <div className={`${viewType === "Condensed" ? "w-60" : "w-80"} bg-slate-50 border-r border-slate-200 overflow-y-auto`}>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
            Release Groups
          </h3>
          
          {releasesByGroup.map(({ group, releases: groupReleases }) => (
            <div key={group.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: group.color }}
                  />
                  <h4 className="font-semibold text-slate-700">{group.name}</h4>
                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                    {groupReleases.length}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const newCollapsed = new Set(collapsedGroups);
                    if (newCollapsed.has(group.id)) {
                      newCollapsed.delete(group.id);
                    } else {
                      newCollapsed.add(group.id);
                    }
                    setCollapsedGroups(newCollapsed);
                  }}
                >
                  {collapsedGroups.has(group.id) ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {!collapsedGroups.has(group.id) && (
                <div className="space-y-2 ml-5">
                  {groupReleases.map((release, index) => (
                  <div
                    key={release.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer h-14"
                    onClick={() => {
                      console.log('Sidebar release clicked:', release.id);
                      onReleaseEdit(release.id);
                    }}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", release.id);
                      e.dataTransfer.setData("sourceGroupId", group.id);
                      e.dataTransfer.setData("sourceIndex", index.toString());
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedReleaseId = e.dataTransfer.getData("text/plain");
                      const sourceGroupId = e.dataTransfer.getData("sourceGroupId");
                      const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"));
                      
                      if (draggedReleaseId !== release.id) {
                        console.log('Reordering release:', { draggedReleaseId, targetReleaseId: release.id, sourceGroupId, targetGroupId: group.id });
                        // Here you would implement the reordering logic
                        // For now, just log it
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${group.color}20` }}
                      >
                        {release.icon.startsWith('lucide-') ? (
                          (() => {
                            const iconName = release.icon.replace('lucide-', '');
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
                              Car, Truck, Plane, Train, Ship, Bike, Bus, 
                              PlaneTakeoff, PlaneLanding, MapPin, Map, Compass, 
                              Route, Navigation2, Move, ArrowRight, ArrowUp, ArrowDown,
                              TreePine, Leaf, Flower, Sun, Moon, Star, Cloud, 
                              Snowflake, Droplets, Flame, Atom, Dna, Microscope, Telescope, 
                              TestTube, Magnet, Thermometer, Wind
                            };
                            const IconComponent = iconMap[iconName] || Rocket;
                            return <IconComponent className="w-4 h-4" style={{ color: group.color }} />;
                          })()
                        ) : (
                          <i 
                            className={`${release.icon} text-sm`}
                            style={{ color: group.color }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{release.name}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(release.startDate).toLocaleDateString()} - {new Date(release.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-300 hover:text-slate-500">
                      <i className="fas fa-grip-vertical" />
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Timeline */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-max" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
          {/* Timeline Header */}
          <div className="h-16 bg-slate-100 border-b border-slate-200 flex items-center px-4">
            <div className="flex gap-4 w-full min-w-max" style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${timelineData.labels.length}, 1fr)`,
              minWidth: '800px'
            }}>
              {timelineData.labels.map((label, index) => (
                <div key={label} className="text-center">
                  <div className="text-sm font-semibold text-slate-700">{label}</div>
                  <div className="text-xs text-slate-500">{timelineData.sublabels[index]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Body - exact mirror of sidebar structure */}
          <div className="p-4">
            {releasesByGroup.map(({ group, releases: groupReleases }) => (
              <div key={group.id} className="mb-6">
                {/* Group header - exact match to sidebar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <h4 className="font-semibold text-slate-700">{group.name}</h4>
                  </div>
                </div>
                
                {!collapsedGroups.has(group.id) && (
                  <div className="space-y-2 ml-5">
                    {groupReleases.map((release) => (
                      <div key={release.id} className={`${viewType === "Condensed" ? "h-8" : "h-14"} flex items-center`}>
                        <TimelineBar
                          release={release}
                          group={group}
                          onEdit={() => onReleaseEdit(release.id)}
                          viewMode={viewMode}
                          viewType={viewType}
                          timelineLabels={timelineData.labels}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Timeline Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full grid gap-4 opacity-20" style={{ 
              gridTemplateColumns: `repeat(${timelineData.labels.length}, 1fr)`,
              minWidth: '800px'
            }}>
              {timelineData.labels.map((_, index) => (
                <div key={index} className="border-r border-slate-200" />
              ))}
            </div>
          </div>

          {/* Current Day Line */}
          {currentDayPosition >= 0 && settings && (
            <div 
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{
                left: `${currentDayPosition}%`,
                borderLeft: `${settings.currentDayLineThickness || 2}px dotted ${settings.currentDayLineColor || '#000000'}`
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
