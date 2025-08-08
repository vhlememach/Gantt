import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimelineBar from "./timeline-bar";
import type { ReleaseGroup, Release } from "@shared/schema";

interface GanttChartProps {
  zoomLevel: number;
  viewMode: string;
  onReleaseEdit: (releaseId: string) => void;
}

export default function GanttChart({ zoomLevel, viewMode, onReleaseEdit }: GanttChartProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
  });

  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  // Group releases by group
  const releasesByGroup = groups.map(group => ({
    group,
    releases: releases.filter(release => release.groupId === group.id),
  }));

  // Generate timeline based on view mode
  const getTimelineData = (mode: string) => {
    if (mode === "Quarters") {
      return {
        labels: ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"],
        sublabels: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"]
      };
    } else if (mode === "Months") {
      return {
        labels: ["Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024", "Jul 2024", "Aug 2024"],
        sublabels: ["Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4", "Week 1-4"]
      };
    } else { // Weeks
      return {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
        sublabels: ["Jan 1-7", "Jan 8-14", "Jan 15-21", "Jan 22-28", "Feb 1-7", "Feb 8-14", "Feb 15-21", "Feb 22-28"]
      };
    }
  };

  const timelineData = getTimelineData(viewMode);

  return (
    <div className="flex h-full">
      {/* Left Panel - Release List */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto">
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
                  {groupReleases.map((release) => (
                  <div
                    key={release.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onReleaseEdit(release.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${group.color}20` }}
                      >
                        <i 
                          className={`${release.icon} text-sm`}
                          style={{ color: group.color }}
                        />
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

          {/* Timeline Body */}
          <div className="p-4">
            <div className="space-y-8">
              {releasesByGroup.map(({ group, releases: groupReleases }) => (
                <div key={group.id}>
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: group.color }}
                    />
                    <h4 className="font-semibold text-slate-700">{group.name}</h4>
                  </div>
                  
                  <div className="space-y-3 ml-5">
                    {groupReleases.map((release) => (
                      <TimelineBar
                        key={release.id}
                        release={release}
                        groupColor={group.color}
                        onEdit={() => onReleaseEdit(release.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
        </div>
      </div>
    </div>
  );
}
