import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Settings, Megaphone, Mail, FileText, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation, MobileNavigation } from "@/components/ui/navigation";
import EvergreenBoxEditorModal from "@/components/evergreen/evergreen-box-editor-modal";
import WaterfallCyclesModal from "@/components/evergreen/waterfall-cycles-modal";
import type { EvergreenBox, ReleaseGroup, WaterfallCycle } from "@shared/schema";

interface EvergreenPageProps {}

export default function EvergreenPage({}: EvergreenPageProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [isCyclesModalOpen, setIsCyclesModalOpen] = useState(false);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);

  // Fetch data
  const { data: groups = [] } = useQuery<ReleaseGroup[]>({
    queryKey: ["/api/release-groups"],
  });

  const { data: boxes = [] } = useQuery<EvergreenBox[]>({
    queryKey: ["/api/evergreen-boxes"],
  });

  const { data: waterfallCycles = [] } = useQuery<WaterfallCycle[]>({
    queryKey: ["/api/waterfall-cycles"],
  });

  // Group boxes by release group
  const boxesByGroup = groups.map(group => ({
    group,
    boxes: boxes.filter(box => box.groupId === group.id)
  }));

  const getWaterfallCycleName = (cycleId: string | null) => {
    if (!cycleId) return "No cycle assigned";
    const cycle = waterfallCycles.find(c => c.id === cycleId);
    return cycle?.name || "Unknown cycle";
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "lucide-megaphone":
        return <Megaphone className="h-6 w-6" />;
      case "lucide-mail":
        return <Mail className="h-6 w-6" />;
      case "lucide-file-text":
        return <FileText className="h-6 w-6" />;
      default:
        return <Megaphone className="h-6 w-6" />;
    }
  };

  const handleBoxClick = (boxId: string) => {
    setEditingBoxId(boxId);
    setIsBoxModalOpen(true);
  };

  const handleAddNewBox = () => {
    setEditingBoxId(null);
    setIsBoxModalOpen(true);
  };

  const handleCloseBoxModal = () => {
    setIsBoxModalOpen(false);
    setEditingBoxId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Evergreen Content
                </h1>
                
                {/* Navigation */}
                <div className="hidden md:block">
                  <Navigation />
                </div>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Monthly recurring content requirements and campaigns
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Back to Gantt</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setIsCyclesModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Manage Waterfall Cycles</span>
              </Button>
              <Button 
                onClick={handleAddNewBox}
                className="bg-[#7232d9] hover:bg-[#6028c5] text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Evergreen Box</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {boxesByGroup.map(({ group, boxes: groupBoxes }) => (
          <div key={group.id} className="mb-8">
            {/* Group Header */}
            <div className="flex items-center mb-4">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: group.color }}
              />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {group.name}
              </h2>
              <Badge variant="outline" className="ml-2">
                {groupBoxes.length} box{groupBoxes.length !== 1 ? 'es' : ''}
              </Badge>
            </div>

            {/* Boxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupBoxes.map((box) => (
                <Card 
                  key={box.id}
                  onClick={() => handleBoxClick(box.id)}
                  className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-l-4"
                  style={{ borderLeftColor: group.color }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: group.color + "15",
                            color: group.color 
                          }}
                        >
                          {getIconComponent(box.icon)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            {box.title}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {box.description}
                    </CardDescription>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Responsible:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {box.responsible || "Unassigned"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Waterfall Cycle:</span>
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                        >
                          {getWaterfallCycleName(box.waterfallCycleId)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Box Card */}
              <Card 
                onClick={handleAddNewBox}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200 cursor-pointer"
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Add New Box
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click to create a new evergreen content box
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}

        {boxes.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <Megaphone className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Evergreen Content Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Get started by creating your first evergreen content box. These represent ongoing monthly content requirements.
              </p>
              <Button 
                onClick={handleAddNewBox}
                className="bg-[#7232d9] hover:bg-[#6028c5] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Box
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EvergreenBoxEditorModal
        isOpen={isBoxModalOpen}
        onClose={handleCloseBoxModal}
        boxId={editingBoxId}
      />
      
      <WaterfallCyclesModal
        isOpen={isCyclesModalOpen}
        onClose={() => setIsCyclesModalOpen(false)}
      />

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}