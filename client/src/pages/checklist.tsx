import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChecklistTask, Release } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, User, CheckCircle, Clock, Users, BarChart3 } from "lucide-react";
import { Link } from "wouter";

const teamMembers = ["Brian", "Alex", "Lucas", "Victor"];

export default function ChecklistPage() {
  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch all checklist tasks
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<ChecklistTask[]>({
    queryKey: ["/api/checklist-tasks"],
  });

  // Fetch all releases for the dropdown
  const { data: releases = [] } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  // Filter tasks by selected member
  const memberTasks = allTasks.filter(task => task.assignedTo === selectedMember);

  // Group tasks by release
  const tasksByRelease = memberTasks.reduce((acc, task) => {
    const releaseId = task.releaseId || 'unassigned';
    if (!acc[releaseId]) {
      acc[releaseId] = [];
    }
    acc[releaseId].push(task);
    return acc;
  }, {} as Record<string, ChecklistTask[]>);

  // Calculate completion percentage for each release
  const getReleaseProgress = (releaseId: string) => {
    const releaseTasks = allTasks.filter(task => task.releaseId === releaseId);
    if (releaseTasks.length === 0) return 0;
    const completedTasks = releaseTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / releaseTasks.length) * 100);
  };

  // Update task completion
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      return apiRequest(`/api/checklist-tasks/${id}`, {
        method: 'PUT',
        body: { completed }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
    }
  });

  // Create new task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { releaseId: string, assignedTo: string, taskTitle: string }) => {
      return apiRequest('/api/checklist-tasks', {
        method: 'POST',
        body: taskData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-tasks"] });
      setNewTaskTitle("");
      setSelectedReleaseId("");
    }
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({ id: taskId, completed });
  };

  const handleCreateTask = () => {
    if (newTaskTitle && selectedReleaseId) {
      createTaskMutation.mutate({
        releaseId: selectedReleaseId,
        assignedTo: selectedMember,
        taskTitle: newTaskTitle
      });
    }
  };

  if (tasksLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading checklist...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Marketing Team Checklist
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track task completion for all team members across releases
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Back to Gantt Chart
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={selectedMember} onValueChange={setSelectedMember}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {teamMembers.map(member => {
            const memberTasksCount = allTasks.filter(task => task.assignedTo === member);
            const completedCount = memberTasksCount.filter(task => task.completed).length;
            
            return (
              <TabsTrigger key={member} value={member} className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{member}</span>
                <Badge variant="outline" className="ml-2">
                  {completedCount}/{memberTasksCount.length}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {teamMembers.map(member => (
          <TabsContent key={member} value={member}>
            <div className="space-y-6">
              {/* Add New Task Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add New Task for {member}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                    </div>
                    <div className="w-64">
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={selectedReleaseId}
                        onChange={(e) => setSelectedReleaseId(e.target.value)}
                      >
                        <option value="">Select Release...</option>
                        {releases.map(release => (
                          <option key={release.id} value={release.id}>
                            {release.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button 
                      onClick={handleCreateTask}
                      disabled={!newTaskTitle || !selectedReleaseId || createTaskMutation.isPending}
                    >
                      Add Task
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks by Release */}
              {Object.entries(tasksByRelease).map(([releaseId, tasks]) => {
                const release = releases.find(r => r.id === releaseId);
                const releaseProgress = getReleaseProgress(releaseId);
                
                return (
                  <Card key={releaseId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span>{release?.name || 'Unassigned Tasks'}</span>
                          <Badge variant={releaseProgress === 100 ? "default" : "outline"}>
                            {releaseProgress}% Complete
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4" />
                          <span>{tasks.filter(t => t.completed).length}/{tasks.length} completed</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tasks.map(task => (
                          <div
                            key={task.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border ${
                              task.completed 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                            }`}
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => 
                                handleTaskToggle(task.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${
                                task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                              }`}>
                                {task.taskTitle}
                              </div>
                              {task.taskDescription && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {task.taskDescription}
                                </div>
                              )}
                            </div>
                            {task.completed ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {memberTasks.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No tasks assigned to {member} yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}