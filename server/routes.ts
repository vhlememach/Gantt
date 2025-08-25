import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertReleaseGroupSchema, insertReleaseSchema, insertAppSettingsSchema, insertChecklistTaskSchema,
  insertWaterfallCycleSchema, insertContentFormatAssignmentSchema, insertEvergreenBoxSchema,
  insertTaskSocialMediaSchema, insertCustomDividerSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Release Groups
  app.get("/api/release-groups", async (req, res) => {
    try {
      const groups = await storage.getReleaseGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get release groups" });
    }
  });

  app.post("/api/release-groups", async (req, res) => {
    try {
      const validatedData = insertReleaseGroupSchema.parse(req.body);
      const group = await storage.createReleaseGroup(validatedData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid release group data" });
    }
  });

  app.put("/api/release-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertReleaseGroupSchema.partial().parse(req.body);
      const group = await storage.updateReleaseGroup(id, validatedData);
      if (!group) {
        return res.status(404).json({ message: "Release group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid release group data" });
    }
  });

  // Bulk delete all release groups
  app.delete("/api/release-groups", async (req, res) => {
    try {
      const groups = await storage.getReleaseGroups();
      for (const group of groups) {
        await storage.deleteReleaseGroup(group.id);
      }
      res.json({ success: true, message: "All release groups deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete release groups" });
    }
  });

  app.delete("/api/release-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReleaseGroup(id);
      if (!deleted) {
        return res.status(404).json({ message: "Release group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete release group" });
    }
  });

  // Releases
  app.get("/api/releases", async (req, res) => {
    try {
      const releases = await storage.getReleases();
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get releases" });
    }
  });

  app.get("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const release = await storage.getRelease(id);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      res.status(500).json({ message: "Failed to get release" });
    }
  });

  app.get("/api/releases/group/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const releases = await storage.getReleasesByGroupId(groupId);
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get releases for group" });
    }
  });

  app.post("/api/releases", async (req, res) => {
    try {
      console.log('Creating release with data:', req.body);
      const validatedData = insertReleaseSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const release = await storage.createRelease(validatedData);
      
      // Note: No dummy tasks are generated for new releases
      // Users can manually add tasks as needed
      
      res.json(release);
    } catch (error) {
      console.error('Release creation error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", errors: (error as any).errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: "Invalid release data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid release data", error: String(error) });
      }
    }
  });

  app.put("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Updating release', id, 'with data:', req.body);
      const validatedData = insertReleaseSchema.partial().parse(req.body);
      console.log('Validated data:', validatedData);
      const release = await storage.updateRelease(id, validatedData);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      console.error('Release update error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", errors: (error as any).errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: "Invalid release data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid release data", error: String(error) });
      }
    }
  });

  app.patch("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Patching release', id, 'with data:', req.body);
      const validatedData = insertReleaseSchema.partial().parse(req.body);
      console.log('Validated data:', validatedData);
      const release = await storage.updateRelease(id, validatedData);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      console.error('Release patch error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", errors: (error as any).errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: "Invalid release data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid release data", error: String(error) });
      }
    }
  });

  // Bulk delete all releases
  app.delete("/api/releases", async (req, res) => {
    try {
      const releases = await storage.getReleases();
      for (const release of releases) {
        await storage.deleteRelease(release.id);
      }
      res.json({ success: true, message: "All releases deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete releases" });
    }
  });

  app.delete("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRelease(id);
      if (!deleted) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete release" });
    }
  });

  // App Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get app settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertAppSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateAppSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  // Checklist Tasks endpoints
  app.get("/api/checklist-tasks", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  app.get("/api/checklist-tasks/release/:releaseId", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasksByRelease(req.params.releaseId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks by release:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  app.get("/api/checklist-tasks/member/:member", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasksByMember(req.params.member);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks by member:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  app.post("/api/checklist-tasks", async (req, res) => {
    try {
      const validatedData = insertChecklistTaskSchema.parse(req.body);
      const newTask = await storage.createChecklistTask(validatedData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating checklist task:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.put("/api/checklist-tasks/:id", async (req, res) => {
    try {
      const validatedData = insertChecklistTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateChecklistTask(req.params.id, validatedData);
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // If this is a custom divider task, handle bidirectional synchronization
      if (updatedTask.customDividerId) {
        // Update completion status synchronization (existing logic)
        if (validatedData.completed !== undefined) {
          // Check if all tasks for this custom divider are completed
          const allTasks = await storage.getChecklistTasksByCustomDividerId(updatedTask.customDividerId);
          const allCompleted = allTasks.every(t => t.completed);
          
          // Update the custom divider completion status
          await storage.updateCustomDivider(updatedTask.customDividerId, { completed: allCompleted });
        }
        
        // Bidirectional synchronization for content fields (taskTitle, mediaLink, taskUrl)
        const hasContentChanges = validatedData.taskTitle !== undefined || 
                                  validatedData.mediaLink !== undefined || 
                                  validatedData.taskUrl !== undefined;
        
        if (hasContentChanges) {
          // Get all tasks for this custom divider
          const allTasks = await storage.getChecklistTasksByCustomDividerId(updatedTask.customDividerId);
          
          // Update all other tasks with the same content
          for (const task of allTasks) {
            if (task.id !== updatedTask.id) {
              const updateData: any = {};
              if (validatedData.taskTitle !== undefined) updateData.taskTitle = validatedData.taskTitle;
              if (validatedData.mediaLink !== undefined) updateData.mediaLink = validatedData.mediaLink;
              if (validatedData.taskUrl !== undefined) updateData.taskUrl = validatedData.taskUrl;
              
              await storage.updateChecklistTask(task.id, updateData);
            }
          }
          
          // Update the custom divider with the new content
          const dividerUpdateData: any = {};
          if (validatedData.taskTitle !== undefined) dividerUpdateData.name = validatedData.taskTitle;
          if (validatedData.mediaLink !== undefined) dividerUpdateData.mediaLink = validatedData.mediaLink;
          if (validatedData.taskUrl !== undefined) dividerUpdateData.textLink = validatedData.taskUrl;
          
          await storage.updateCustomDivider(updatedTask.customDividerId, dividerUpdateData);
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating checklist task:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  // Review system routes
  app.post("/api/checklist-tasks/:id/request-review", async (req, res) => {
    try {
      const { id } = req.params;
      const { changes } = req.body;
      const task = await storage.getChecklistTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const nextVersion = (task.currentVersion || 1) + 1;
      if (nextVersion > 10) {
        return res.status(400).json({ message: "Maximum version limit (v10) reached" });
      }
      
      const updatedTask = await storage.updateChecklistTask(id, {
        reviewStatus: "requested",
        currentVersion: nextVersion,
        reviewChanges: changes,
        reviewSubmissionUrl: null // Clear previous submission URL
      });
      
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: "Failed to request review" });
    }
  });

  app.post("/api/checklist-tasks/:id/submit-review", async (req, res) => {
    try {
      const { id } = req.params;
      const { submissionUrl } = req.body;
      const task = await storage.getChecklistTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedTask = await storage.updateChecklistTask(id, {
        reviewSubmissionUrl: submissionUrl
      });
      
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: "Failed to submit review" });
    }
  });

  app.post("/api/checklist-tasks/:id/approve-review", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTask = await storage.updateChecklistTask(id, {
        reviewStatus: "approved",
        completed: true
      });
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: "Failed to approve review" });
    }
  });

  // Schedule task to calendar
  app.patch("/api/checklist-tasks/:id/schedule", async (req, res) => {
    try {
      const { scheduledDate } = req.body;
      const updatedTask = await storage.updateChecklistTask(req.params.id, { scheduledDate });
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      console.error("Error scheduling task:", error);
      res.status(400).json({ error: "Failed to schedule task" });
    }
  });

  // Remove task from calendar
  app.patch("/api/checklist-tasks/:id/unschedule", async (req, res) => {
    try {
      const updatedTask = await storage.updateChecklistTask(req.params.id, { scheduledDate: null });
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      console.error("Error unscheduling task:", error);
      res.status(500).json({ error: "Failed to unschedule task" });
    }
  });

  // Bulk delete all checklist tasks
  app.delete("/api/checklist-tasks", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasks();
      for (const task of tasks) {
        await storage.deleteChecklistTask(task.id);
      }
      res.json({ success: true, message: "All checklist tasks deleted" });
    } catch (error) {
      console.error("Error deleting all checklist tasks:", error);
      res.status(500).json({ error: "Failed to delete all tasks" });
    }
  });

  app.delete("/api/checklist-tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChecklistTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting checklist task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Cleanup tasks for removed format assignments
  app.post("/api/checklist-tasks/cleanup", async (req, res) => {
    try {
      const { assignedTo, contentFormatType } = req.body;
      const allTasks = await storage.getChecklistTasks();
      
      // Find tasks that match the criteria for cleanup (format type + assignee for both release and evergreen)
      const tasksToDelete = allTasks.filter(task => 
        task.assignedTo === assignedTo &&
        task.taskTitle?.toLowerCase().includes(contentFormatType.toLowerCase()) &&
        (task.evergreenBoxId || task.releaseId) // Include both evergreen and release tasks
      );
      
      // Delete each matching task
      for (const task of tasksToDelete) {
        await storage.deleteChecklistTask(task.id);
      }
      
      res.json({ deletedCount: tasksToDelete.length });
    } catch (error) {
      console.error("Error cleaning up tasks:", error);
      res.status(500).json({ error: "Failed to cleanup tasks" });
    }
  });

  // Generate evergreen tasks for all boxes with assigned waterfall cycles
  app.post("/api/evergreen-tasks/generate", async (req, res) => {
    try {
      console.log("Starting evergreen task generation...");
      
      const evergreenBoxes = await storage.getEvergreenBoxes();
      const assignments = await storage.getContentFormatAssignments();
      const cycles = await storage.getWaterfallCycles();
      const existingTasks = await storage.getChecklistTasks();
      const releases = await storage.getReleases();
      
      console.log("Found boxes:", evergreenBoxes.length, "assignments:", assignments.length, "cycles:", cycles.length, "releases:", releases.length);
      
      // Get waterfall cycles that are actually being used by releases
      const activeWaterfallCycles = new Set(
        releases
          .filter(release => release.waterfallCycleId)
          .map(release => release.waterfallCycleId)
      );
      
      console.log("Active waterfall cycles:", Array.from(activeWaterfallCycles));
      
      // Clean up existing evergreen tasks from inactive waterfall cycles
      const evergreenTasks = existingTasks.filter(task => task.evergreenBoxId);
      let tasksDeleted = 0;
      
      for (const task of evergreenTasks) {
        const box = evergreenBoxes.find(b => b.id === task.evergreenBoxId);
        if (box && box.waterfallCycleId && !activeWaterfallCycles.has(box.waterfallCycleId)) {
          console.log(`Deleting task for inactive waterfall cycle: ${task.taskTitle}`);
          await storage.deleteChecklistTask(task.id);
          tasksDeleted++;
        }
      }
      
      let tasksCreated = 0;
      
      for (const box of evergreenBoxes) {
        if (box.waterfallCycleId && activeWaterfallCycles.has(box.waterfallCycleId)) {
          const cycle = cycles.find(c => c.id === box.waterfallCycleId);
          
          if (cycle) {
            console.log(`Generating tasks for box "${box.title}" with cycle "${cycle.name}"`);
            
            for (const assignment of assignments) {
              const formatType = assignment.formatType;
              const requirement = (cycle.contentRequirements as any)?.[formatType] || 0;
              
              if (requirement > 0 && assignment.assignedMembers.length > 0) {
                // Create ONE task per format, assigned to first member
                const assignedMember = assignment.assignedMembers[0];
                const taskName = `${box.title} > ${formatType.charAt(0).toUpperCase() + formatType.slice(1)}`;
                
                // Check if task already exists with same title and evergreen box
                const existingTask = existingTasks.find(task => 
                  task.taskTitle === taskName && 
                  task.evergreenBoxId === box.id &&
                  task.contentFormatType === formatType
                );
                
                if (!existingTask) {
                  const taskData = {
                    taskTitle: taskName,
                    assignedTo: assignedMember,
                    releaseId: null, // Evergreen tasks are not tied to releases
                    evergreenBoxId: box.id,
                    customDividerId: null, // Not a custom divider task
                    waterfallCycleId: box.waterfallCycleId,
                    contentFormatType: formatType,
                    completed: false
                  };
                  
                  console.log("Creating task:", taskData);
                  await storage.createChecklistTask(taskData);
                  tasksCreated++;
                } else {
                  console.log(`Task already exists: ${taskName}`);
                }
              }
            }
          }
        }
      }
      
      console.log(`Generated ${tasksCreated} evergreen tasks, deleted ${tasksDeleted} tasks from inactive cycles`);
      res.json({ 
        message: "Evergreen tasks generated successfully", 
        tasksCreated,
        tasksDeleted
      });
    } catch (error) {
      console.error("Error generating evergreen tasks:", error);
      res.status(500).json({ error: "Failed to generate evergreen tasks" });
    }
  });

  // Waterfall Cycles
  app.get("/api/waterfall-cycles", async (req, res) => {
    try {
      const cycles = await storage.getWaterfallCycles();
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get waterfall cycles" });
    }
  });

  app.get("/api/waterfall-cycles/:id", async (req, res) => {
    try {
      const cycle = await storage.getWaterfallCycle(req.params.id);
      if (!cycle) {
        return res.status(404).json({ message: "Waterfall cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      res.status(500).json({ message: "Failed to get waterfall cycle" });
    }
  });

  app.post("/api/waterfall-cycles", async (req, res) => {
    try {
      const validatedData = insertWaterfallCycleSchema.parse(req.body);
      const cycle = await storage.createWaterfallCycle(validatedData);
      res.json(cycle);
    } catch (error) {
      res.status(400).json({ message: "Invalid waterfall cycle data" });
    }
  });

  app.put("/api/waterfall-cycles/:id", async (req, res) => {
    try {
      const validatedData = insertWaterfallCycleSchema.partial().parse(req.body);
      const cycle = await storage.updateWaterfallCycle(req.params.id, validatedData);
      if (!cycle) {
        return res.status(404).json({ message: "Waterfall cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      res.status(400).json({ message: "Invalid waterfall cycle data" });
    }
  });

  // Bulk delete all waterfall cycles
  app.delete("/api/waterfall-cycles", async (req, res) => {
    try {
      const cycles = await storage.getWaterfallCycles();
      for (const cycle of cycles) {
        await storage.deleteWaterfallCycle(cycle.id);
      }
      res.json({ success: true, message: "All waterfall cycles deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete waterfall cycles" });
    }
  });

  app.delete("/api/waterfall-cycles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWaterfallCycle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Waterfall cycle not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Detailed waterfall cycle deletion error:", error);
      res.status(500).json({ 
        message: "Failed to delete waterfall cycle", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Content Format Assignments
  app.get("/api/content-format-assignments", async (req, res) => {
    try {
      const assignments = await storage.getContentFormatAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get content format assignments" });
    }
  });

  app.post("/api/content-format-assignments", async (req, res) => {
    try {
      const validatedData = insertContentFormatAssignmentSchema.parse(req.body);
      const assignment = await storage.createContentFormatAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid content format assignment data" });
    }
  });

  app.put("/api/content-format-assignments/:id", async (req, res) => {
    try {
      const validatedData = insertContentFormatAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateContentFormatAssignment(req.params.id, validatedData);
      if (!assignment) {
        return res.status(404).json({ message: "Content format assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid content format assignment data" });
    }
  });

  app.delete("/api/content-format-assignments", async (req, res) => {
    try {
      // Clear all assignments
      const assignments = await storage.getContentFormatAssignments();
      for (const assignment of assignments) {
        await storage.deleteContentFormatAssignment(assignment.id);
      }
      res.status(200).json({ message: "All assignments deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignments" });
    }
  });

  // Evergreen Boxes
  app.get("/api/evergreen-boxes", async (req, res) => {
    try {
      const boxes = await storage.getEvergreenBoxes();
      res.json(boxes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evergreen boxes" });
    }
  });

  app.get("/api/evergreen-boxes/:id", async (req, res) => {
    try {
      const box = await storage.getEvergreenBox(req.params.id);
      if (!box) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json(box);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evergreen box" });
    }
  });

  app.get("/api/evergreen-boxes/group/:groupId", async (req, res) => {
    try {
      const boxes = await storage.getEvergreenBoxesByGroup(req.params.groupId);
      res.json(boxes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evergreen boxes for group" });
    }
  });

  app.post("/api/evergreen-boxes", async (req, res) => {
    try {
      console.log("Creating evergreen box with data:", req.body);
      const validatedData = insertEvergreenBoxSchema.parse(req.body);
      console.log("Validated evergreen box data:", validatedData);
      const box = await storage.createEvergreenBox(validatedData);
      res.json(box);
    } catch (error) {
      console.error("Evergreen box validation failed:", error);
      if (error instanceof Error) {
        console.error("Detailed validation error:", error.message);
      }
      res.status(400).json({ 
        message: "Invalid evergreen box data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/evergreen-boxes/:id", async (req, res) => {
    try {
      const validatedData = insertEvergreenBoxSchema.partial().parse(req.body);
      const box = await storage.updateEvergreenBox(req.params.id, validatedData);
      if (!box) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json(box);
    } catch (error) {
      res.status(400).json({ message: "Invalid evergreen box data" });
    }
  });

  app.patch("/api/evergreen-boxes/:id", async (req, res) => {
    try {
      const validatedData = insertEvergreenBoxSchema.partial().parse(req.body);
      const box = await storage.updateEvergreenBox(req.params.id, validatedData);
      if (!box) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json(box);
    } catch (error) {
      res.status(400).json({ message: "Invalid evergreen box data" });
    }
  });

  // Bulk delete all evergreen boxes
  app.delete("/api/evergreen-boxes", async (req, res) => {
    try {
      const boxes = await storage.getEvergreenBoxes();
      for (const box of boxes) {
        await storage.deleteEvergreenBox(box.id);
      }
      res.json({ success: true, message: "All evergreen boxes deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete evergreen boxes" });
    }
  });

  app.delete("/api/evergreen-boxes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEvergreenBox(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete evergreen box" });
    }
  });

  // Checklist tasks by evergreen box
  app.get("/api/checklist-tasks/evergreen/:evergreenBoxId", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasksByEvergreenBox(req.params.evergreenBoxId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks by evergreen box:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  // Task Social Media API routes
  app.get("/api/task-social-media", async (req, res) => {
    try {
      const socialMedia = await storage.getTaskSocialMedia();
      res.json(socialMedia);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task social media" });
    }
  });

  app.get("/api/task-social-media/task/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const socialMedia = await storage.getTaskSocialMediaByTask(taskId);
      res.json(socialMedia || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task social media" });
    }
  });

  app.post("/api/task-social-media", async (req, res) => {
    try {
      const validatedData = insertTaskSocialMediaSchema.parse(req.body);
      // Check if social media for this task already exists
      const existing = await storage.getTaskSocialMediaByTask(validatedData.taskId);
      if (existing) {
        // Update existing
        const updated = await storage.updateTaskSocialMedia(existing.id, validatedData);
        res.json(updated);
      } else {
        // Create new
        const socialMedia = await storage.createTaskSocialMedia(validatedData);
        res.json(socialMedia);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid task social media data" });
    }
  });

  app.put("/api/task-social-media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTaskSocialMediaSchema.partial().parse(req.body);
      const socialMedia = await storage.updateTaskSocialMedia(id, validatedData);
      if (!socialMedia) {
        return res.status(404).json({ message: "Task social media not found" });
      }
      res.json(socialMedia);
    } catch (error) {
      res.status(400).json({ message: "Invalid task social media data" });
    }
  });

  // Bulk delete all task social media
  app.delete("/api/task-social-media", async (req, res) => {
    try {
      const allSocialMedia = await storage.getTaskSocialMedia();
      for (const sm of allSocialMedia) {
        await storage.deleteTaskSocialMedia(sm.id);
      }
      res.json({ success: true, message: "All task social media deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task social media" });
    }
  });

  app.delete("/api/task-social-media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTaskSocialMedia(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task social media not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task social media" });
    }
  });

  // Custom Dividers
  app.get("/api/custom-dividers", async (req, res) => {
    try {
      const dividers = await storage.getCustomDividers();
      res.json(dividers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get custom dividers" });
    }
  });

  app.post("/api/custom-dividers", async (req, res) => {
    try {
      const validatedData = insertCustomDividerSchema.parse(req.body);
      const divider = await storage.createCustomDivider(validatedData);
      
      // If assigned to project and team members, create corresponding checklist tasks
      if (validatedData.releaseId && validatedData.assignedMembers?.length) {
        for (const member of validatedData.assignedMembers) {
          await storage.createChecklistTask({
            customDividerId: divider.id,
            releaseId: validatedData.releaseId,
            evergreenBoxId: null,
            waterfallCycleId: null,
            assignedTo: member,
            taskTitle: validatedData.name,
            taskDescription: `Custom divider task: ${validatedData.name}`,
            taskUrl: validatedData.mediaLink || validatedData.textLink || null,
            taskType: "custom_divider",
            completed: false
          });
        }
      }
      
      res.json(divider);
    } catch (error) {
      res.status(400).json({ message: "Invalid custom divider data" });
    }
  });

  app.put("/api/custom-dividers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomDividerSchema.partial().parse(req.body);
      const divider = await storage.updateCustomDivider(id, validatedData);
      if (!divider) {
        return res.status(404).json({ message: "Custom divider not found" });
      }
      
      // Handle assignment changes (existing logic)
      if (validatedData.assignedMembers || validatedData.releaseId) {
        // Remove old tasks
        const existingTasks = await storage.getChecklistTasksByCustomDividerId(id);
        for (const task of existingTasks) {
          await storage.deleteChecklistTask(task.id);
        }
        
        // Create new tasks if assigned
        if (divider.releaseId && divider.assignedMembers?.length) {
          for (const member of divider.assignedMembers) {
            await storage.createChecklistTask({
              customDividerId: divider.id,
              releaseId: divider.releaseId,
              evergreenBoxId: null,
              waterfallCycleId: null,
              assignedTo: member,
              taskTitle: divider.name,
              taskDescription: `Custom divider task: ${divider.name}`,
              taskUrl: divider.mediaLink || divider.textLink || null,
              taskType: "custom_divider",
              completed: false
            });
          }
        }
      } else {
        // Handle content field changes (bidirectional sync)
        const hasContentChanges = validatedData.name !== undefined || 
                                  validatedData.mediaLink !== undefined || 
                                  validatedData.textLink !== undefined;
        
        if (hasContentChanges) {
          // Get all tasks for this custom divider
          const allTasks = await storage.getChecklistTasksByCustomDividerId(id);
          
          // Update all tasks with the new content
          for (const task of allTasks) {
            const updateData: any = {};
            if (validatedData.name !== undefined) updateData.taskTitle = validatedData.name;
            if (validatedData.mediaLink !== undefined) updateData.mediaLink = validatedData.mediaLink;
            if (validatedData.textLink !== undefined) updateData.taskUrl = validatedData.textLink;
            
            await storage.updateChecklistTask(task.id, updateData);
          }
        }
      }
      
      res.json(divider);
    } catch (error) {
      res.status(400).json({ message: "Invalid custom divider data" });
    }
  });

  app.delete("/api/custom-dividers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCustomDivider(id);
      if (!deleted) {
        return res.status(404).json({ message: "Custom divider not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete custom divider" });
    }
  });

  // Mark custom divider as completed
  app.patch("/api/custom-dividers/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { completed } = req.body;
      
      const divider = await storage.updateCustomDivider(id, { completed });
      if (!divider) {
        return res.status(404).json({ message: "Custom divider not found" });
      }
      
      // Update associated checklist tasks completion status
      const tasks = await storage.getChecklistTasksByCustomDividerId(id);
      for (const task of tasks) {
        await storage.updateChecklistTask(task.id, { completed });
      }
      
      res.json(divider);
    } catch (error) {
      res.status(500).json({ message: "Failed to update custom divider" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
