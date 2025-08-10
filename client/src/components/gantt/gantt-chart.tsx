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
  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(new Set());
  
  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
  });

  const { data: releases = [], refetch: refetchReleases } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/checklist-tasks"],
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
    const today = new Date();
    
    if (viewMode === "Quarters") {
      // For quarters view, calculate position based on the current quarter and month
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-11
      const currentDay = today.getDate();
      
      // Find current quarter position in timeline labels
      const quarterLabels = timelineData.labels;
      let currentQuarterIndex = -1;
      
      for (let i = 0; i < quarterLabels.length; i++) {
        const label = quarterLabels[i];
        if (label.includes(`${currentYear}`)) {
          if ((label.includes('Q1') && currentMonth >= 0 && currentMonth <= 2) ||
              (label.includes('Q2') && currentMonth >= 3 && currentMonth <= 5) ||
              (label.includes('Q3') && currentMonth >= 6 && currentMonth <= 8) ||
              (label.includes('Q4') && currentMonth >= 9 && currentMonth <= 11)) {
            currentQuarterIndex = i;
            break;
          }
        }
      }
      
      if (currentQuarterIndex >= 0) {
        const quarterWidth = 100 / quarterLabels.length;
        const position = (currentQuarterIndex / quarterLabels.length) * 100;
        
        // Add offset within quarter based on month and day
        const monthInQuarter = currentMonth % 3;
        const monthOffset = (monthInQuarter / 3) * quarterWidth;
        const dayOffset = ((currentDay - 1) / 30) * (quarterWidth / 3);
        
        return Math.min(98, position + monthOffset + dayOffset);
      }
    } else if (viewMode === "Months") {
      // For months view, calculate position based on current month
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-11
      const currentDay = today.getDate();
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Find current month in timeline or calculate relative position
      let currentMonthIndex = timelineData.labels.findIndex(label => {
        const parts = label.split(" ");
        if (parts.length === 2) {
          const labelMonth = monthNames.indexOf(parts[0]);
          const labelYear = parseInt(parts[1]);
          return labelMonth === currentMonth && labelYear === currentYear;
        }
        return false;
      });
      
      // If current month not found but timeline has months, calculate relative position
      if (currentMonthIndex === -1 && timelineData.labels.length > 0) {
        const firstLabel = timelineData.labels[0].split(" ");
        const lastLabel = timelineData.labels[timelineData.labels.length - 1].split(" ");
        
        if (firstLabel.length === 2 && lastLabel.length === 2) {
          const firstMonth = monthNames.indexOf(firstLabel[0]);
          const firstYear = parseInt(firstLabel[1]);
          const lastMonth = monthNames.indexOf(lastLabel[0]);
          const lastYear = parseInt(lastLabel[1]);
          
          const firstDate = new Date(firstYear, firstMonth, 1);
          const lastDate = new Date(lastYear, lastMonth + 1, 0);
          
          if (today >= firstDate && today <= lastDate) {
            const totalMonths = (lastYear - firstYear) * 12 + (lastMonth - firstMonth) + 1;
            const currentMonthFromFirst = (currentYear - firstYear) * 12 + (currentMonth - firstMonth);
            const position = (currentMonthFromFirst / totalMonths) * 100;
            const dayOffset = ((currentDay - 1) / 31) * (100 / totalMonths);
            
            return Math.min(98, position + dayOffset);
          }
        }
      } else if (currentMonthIndex >= 0) {
        const monthWidth = 100 / timelineData.labels.length;
        const position = (currentMonthIndex / timelineData.labels.length) * 100;
        const dayOffset = ((currentDay - 1) / 31) * monthWidth;
        
        return Math.min(98, position + dayOffset);
      }
    } else if (viewMode === "Weeks") {
      // For weeks view, calculate position based on current week
      const currentYear = today.getFullYear();
      
      // Calculate current week of year using ISO week standard
      const getWeekOfYear = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };
      
      const currentWeek = getWeekOfYear(today);
      
      // Try to find matching week in timeline labels
      let weekIndex = -1;
      for (let i = 0; i < timelineData.labels.length; i++) {
        const label = timelineData.labels[i];
        const weekMatch = label.match(/Week (\d+)/);
        if (weekMatch && parseInt(weekMatch[1]) === currentWeek) {
          weekIndex = i;
          break;
        }
      }
      
      // If found or calculate relative position
      if (weekIndex >= 0 || (currentWeek >= 1 && currentWeek <= 52)) {
        const weekWidth = 100 / timelineData.labels.length;
        const position = weekIndex >= 0 
          ? (weekIndex / timelineData.labels.length) * 100
          : ((currentWeek - 1) / Math.min(timelineData.labels.length, 52)) * 100;
        
        // Add offset within week
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOffset = (dayOfWeek / 7) * weekWidth;
        
        return Math.min(98, position + dayOffset);
      }
    }
    
    // Fallback: Calculate based on releases date range for any view mode
    if (releases.length > 0) {
      const allDates = releases.flatMap(r => [new Date(r.startDate), new Date(r.endDate)]);
      const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
      
      if (today >= minDate && today <= maxDate) {
        const totalDuration = maxDate.getTime() - minDate.getTime();
        const currentPosition = (today.getTime() - minDate.getTime()) / totalDuration;
        return currentPosition * 100;
      }
    }
    
    return -1; // Not visible in current view
  };

  const currentDayPosition = getCurrentDayPosition();

  return (
    <div className="h-full grid grid-cols-[320px_1fr]">
      {/* Left Panel - Release List */}
      <div className="bg-slate-50 border-r border-slate-200 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
            Release Groups
          </h3>
          
          {releasesByGroup.map(({ group, releases: groupReleases }) => (
            <div key={group.id} className="mb-6">
              {/* Group header */}
              <div className="flex items-center justify-between mb-3 h-12">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: group.color }}
                  />
                  <h4 className="font-semibold text-slate-700">{group.name}</h4>
                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full flex items-center justify-center min-w-[20px] h-5" style={{ lineHeight: '1' }}>
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
                <div className="ml-5 space-y-2">
                  {groupReleases.map((release, index) => {
                    const releaseTasks = (allTasks as any[]).filter((task: any) => task.releaseId === release.id);
                    const isExpanded = expandedReleases.has(release.id);
                    
                    return (
                      <div key={release.id}>
                        <div
                          className={`flex items-center justify-between bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${viewType === "Condensed" ? "h-10" : "h-14"} p-3`}
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
                            }
                          }}
                        >
                          <div 
                            className="flex-1 flex items-center cursor-pointer"
                            onClick={() => {
                              console.log('Sidebar release clicked:', release.id);
                              onReleaseEdit(release.id);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div 
                                className={`${viewType === "Condensed" ? "w-6 h-6" : "w-8 h-8"} rounded-lg flex items-center justify-center`}
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
                                <div className={`font-medium text-slate-800 ${viewType === "Condensed" ? "text-sm truncate" : ""}`}>{release.name}</div>
                                {viewType !== "Condensed" && (
                                  <div className="text-xs text-slate-500">
                                    {new Date(release.startDate).toLocaleDateString()} - {new Date(release.endDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {releaseTasks.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newExpanded = new Set(expandedReleases);
                                  if (newExpanded.has(release.id)) {
                                    newExpanded.delete(release.id);
                                  } else {
                                    newExpanded.add(release.id);
                                  }
                                  setExpandedReleases(newExpanded);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <div className="text-slate-300 hover:text-slate-500">
                              <i className="fas fa-grip-vertical" />
                            </div>
                          </div>
                        </div>
                        

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Timeline */}
      <div className="overflow-x-auto">
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

          {/* Timeline Body - Mirror sidebar structure exactly */}
          <div className="p-4">
            {releasesByGroup.map(({ group, releases: groupReleases }) => (
              <div key={group.id} className="mb-6">
                {/* Group header - exact same height as sidebar */}
                <div className="flex items-center mb-3 h-12">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <h4 className="font-semibold text-slate-700">{group.name}</h4>
                  </div>
                </div>
                
                {!collapsedGroups.has(group.id) && (
                  <div className="ml-5 space-y-2">
                    {groupReleases.map((release, releaseIndex) => {
                      const releaseTasks = (allTasks as any[]).filter((task: any) => task.releaseId === release.id);
                      const isExpanded = expandedReleases.has(release.id);
                      
                      return (
                        <div key={release.id}>
                          {/* Timeline bar - exact same height as sidebar item */}
                          <div className={`${viewType === "Condensed" ? "h-10" : "h-14"} flex items-center`}>
                            <TimelineBar
                              release={release}
                              group={group}
                              onEdit={() => onReleaseEdit(release.id)}
                              viewMode={viewMode}
                              viewType={viewType}
                              timelineLabels={timelineData.labels}
                            />
                          </div>
                          
                          {/* Tasks directly below the bar */}
                          {isExpanded && releaseTasks.length > 0 && (
                            <div className="bg-gray-50 p-2 rounded mb-2">
                              {Object.entries(
                                releaseTasks.reduce((groups: any, task: any) => {
                                  const assignee = task.assignedTo;
                                  if (!groups[assignee]) groups[assignee] = [];
                                  groups[assignee].push(task);
                                  return groups;
                                }, {})
                              ).map(([assignee, tasks]: [string, any]) => (
                                <div key={assignee} className="mb-2 last:mb-0">
                                  <div className="text-xs font-medium text-gray-600 flex items-center space-x-2 mb-1">
                                    <div className="w-1 h-3 rounded" style={{ backgroundColor: group.color }} />
                                    <span>{assignee}</span>
                                  </div>
                                  {(tasks as any[]).map((task: any) => (
                                    <div key={task.id} className="ml-3 mb-1">
                                      <div className="flex items-center space-x-2 text-xs">
                                        <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                          {task.taskTitle}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
          {currentDayPosition >= 0 && (
            <div 
              className="absolute top-16 bottom-0 z-20 pointer-events-none"
              style={{
                left: `calc(${currentDayPosition}% + 16px)`,
                borderLeft: `${(settings as any)?.currentDayLineThickness || 2}px dotted ${(settings as any)?.currentDayLineColor || '#000000'}`
              }}
            >
              {/* Current Day Label */}
              <div 
                className="absolute top-2 -left-12 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-sm whitespace-nowrap"
                style={{ fontSize: '10px' }}
              >
                <div>Current Day</div>
                <div className="text-xs opacity-80">
                  {new Date().toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    year: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
