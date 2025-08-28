import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTask, Release, ReleaseGroup, EvergreenBox } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle, Star, AlertTriangle, ExternalLink, ArrowLeft, Palette } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaReddit } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showCustomDividerModal, setShowCustomDividerModal] = useState<{ day: number; month: number; year: number } | null>(null);
  const [customDividers, setCustomDividers] = useState<Map<string, Array<{ id?: string; name: string; color: string; icon: string; mediaLink?: string; textLink?: string; releaseId?: string | null; evergreenBoxId?: string | null; assignedMembers?: string[]; completed?: boolean }>>>(new Map());
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedIcon, setSelectedIcon] = useState('fas fa-star');
  const [dividerName, setDividerName] = useState('');
  const [dividerMediaLink, setDividerMediaLink] = useState('');
  const [dividerTextLink, setDividerTextLink] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedEvergreenBoxId, setSelectedEvergreenBoxId] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const teamMembers = ["Brian", "Alex", "Lucas", "Victor"];

  // Fetch data
  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["/api/releases"]
  });

  const { data: releaseGroups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"]
  });

  const { data: evergreenBoxes = [] } = useQuery<EvergreenBox[]>({
    queryKey: ["/api/evergreen-boxes"]
  });

  const { data: customDividersData = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-dividers"]
  });

  // Load custom dividers into state when data changes
  useEffect(() => {
    const dividersMap = new Map<string, any[]>();
    customDividersData.forEach((divider) => {
      const existing = dividersMap.get(divider.dateKey) || [];
      existing.push({
        id: divider.id,
        name: divider.name,
        color: divider.color,
        icon: divider.icon,
        mediaLink: divider.mediaLink,
        textLink: divider.textLink,
        releaseId: divider.releaseId,
        evergreenBoxId: divider.evergreenBoxId,
        assignedMembers: divider.assignedMembers || [],
        completed: divider.completed || false
      });
      dividersMap.set(divider.dateKey, existing);
    });
    setCustomDividers(dividersMap);
  }, [customDividersData]);

  // Save custom divider mutation
  const saveCustomDividerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        return apiRequest(`/api/custom-dividers/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        return apiRequest('/api/custom-dividers', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-dividers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      toast({
        title: "Success",
        description: "Calendar item saved successfully!",
      });
    }
  });

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [selectedYear, selectedMonth]);

  const handleAddCustomDivider = () => {
    if (!showCustomDividerModal || !dividerName.trim()) return;

    const { day, month, year } = showCustomDividerModal;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dividerData = {
      name: dividerName,
      color: selectedColor,
      icon: selectedIcon,
      mediaLink: dividerMediaLink,
      textLink: dividerTextLink,
      dateKey,
      releaseId: selectedProjectId || null,
      evergreenBoxId: selectedEvergreenBoxId || null,
      assignedMembers: selectedTeamMembers,
      completed: false
    };

    saveCustomDividerMutation.mutate(dividerData);

    // Reset form
    setDividerName('');
    setDividerMediaLink('');
    setDividerTextLink('');
    setSelectedProjectId('');
    setSelectedEvergreenBoxId('');
    setSelectedTeamMembers([]);
    setShowCustomDividerModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gantt
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthNames[selectedMonth]} {selectedYear}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Day Labels */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {daysOfWeek.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-60"></div>;
              }

              const currentDate = new Date();
              const isToday = 
                day === currentDate.getDate() && 
                selectedMonth === currentDate.getMonth() && 
                selectedYear === currentDate.getFullYear();
              
              const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayDividers = customDividers.get(dateKey) || [];

              return (
                <div
                  key={day}
                  className={`min-h-60 p-3 border-2 transition-colors flex flex-col ${
                    isToday 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    setShowCustomDividerModal({ day, month: selectedMonth, year: selectedYear });
                  }}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day}
                    </span>
                  </div>

                  {/* Custom Dividers */}
                  <div className="space-y-1 flex-1">
                    {dayDividers.map((divider, dividerIndex) => (
                      <div
                        key={dividerIndex}
                        className="text-xs font-medium px-2 py-1 rounded opacity-90 cursor-pointer"
                        style={{ 
                          backgroundColor: divider.color,
                          color: 'white'
                        }}
                        title={divider.name}
                      >
                        <i className={`${divider.icon} mr-1`}></i>
                        {divider.name}
                        {divider.assignedMembers && divider.assignedMembers.length > 0 && (
                          <div className="text-xs mt-1 opacity-80">
                            {divider.assignedMembers.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Divider Modal */}
      {showCustomDividerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Calendar Item - {monthNames[showCustomDividerModal.month]} {showCustomDividerModal.day}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={dividerName}
                  onChange={(e) => setDividerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter item name..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedEvergreenBoxId("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Project...</option>
                    {releases.map(release => (
                      <option key={release.id} value={release.id}>
                        {release.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Evergreen Box
                  </label>
                  <select
                    value={selectedEvergreenBoxId}
                    onChange={(e) => {
                      setSelectedEvergreenBoxId(e.target.value);
                      setSelectedProjectId("");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Evergreen...</option>
                    {evergreenBoxes.map(box => (
                      <option key={box.id} value={box.id}>
                        {box.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign to Team Members
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {teamMembers.map(member => (
                    <label key={member} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTeamMembers.includes(member)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeamMembers([...selectedTeamMembers, member]);
                          } else {
                            setSelectedTeamMembers(selectedTeamMembers.filter(m => m !== member));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{member}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Media Link
                  </label>
                  <input
                    type="text"
                    value={dividerMediaLink}
                    onChange={(e) => setDividerMediaLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional media link..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Text Link
                  </label>
                  <input
                    type="text"
                    value={dividerTextLink}
                    onChange={(e) => setDividerTextLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional text link..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#6B7280', '#EC4899'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 ${selectedColor === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCustomDividerModal(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomDivider}
                disabled={!dividerName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}