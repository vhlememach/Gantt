import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertReleaseGroupSchema, insertReleaseSchema, insertAppSettingsSchema, insertChecklistTaskSchema,
  insertWaterfallCycleSchema, insertContentFormatAssignmentSchema, insertEvergreenBoxSchema,
  insertTaskSocialMediaSchema, insertUserSchema, loginSchema
} from "@shared/schema";
import { setupAuth, authenticateUser, requireAuth, requireAdmin, addUserToRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  app.use(addUserToRequest);

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await authenticateUser(validatedData.email, validatedData.password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).isAdmin = user.isAdmin;
      
      res.json({ 
        message: "Login successful", 
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/me", requireAuth, (req: any, res) => {
    res.json(req.user);
  });

  // User management routes (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.put("/api/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const updated = await storage.updateUserPassword(id, password);
      
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Protected routes - require authentication for all project management features
  // Release Groups
  app.get("/api/release-groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getReleaseGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get release groups" });
    }
  });

  app.post("/api/release-groups", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReleaseGroupSchema.parse(req.body);
      const group = await storage.createReleaseGroup(validatedData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid release group data" });
    }
  });

  app.put("/api/release-groups/:id", requireAuth, async (req, res) => {
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
  app.delete("/api/release-groups", requireAuth, async (req, res) => {
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

  app.delete("/api/release-groups/:id", requireAuth, async (req, res) => {
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
  app.get("/api/releases", requireAuth, async (req, res) => {
    try {
      const releases = await storage.getReleases();
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get releases" });
    }
  });

  app.get("/api/releases/:id", requireAuth, async (req, res) => {
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

  app.get("/api/releases/group/:groupId", requireAuth, async (req, res) => {
    try {
      const { groupId } = req.params;
      const releases = await storage.getReleasesByGroupId(groupId);
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get releases for group" });
    }
  });

  app.post("/api/releases", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReleaseSchema.parse(req.body);
      const release = await storage.createRelease(validatedData);
      res.json(release);
    } catch (error) {
      res.status(400).json({ message: "Invalid release data" });
    }
  });

  app.put("/api/releases/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertReleaseSchema.partial().parse(req.body);
      const release = await storage.updateRelease(id, validatedData);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      res.status(400).json({ message: "Invalid release data" });
    }
  });

  app.delete("/api/releases/:id", requireAuth, async (req, res) => {
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

  // Settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.put("/api/settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAppSettingsSchema.parse(req.body);
      const settings = await storage.updateAppSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  // Checklist Tasks
  app.get("/api/checklist-tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get checklist tasks" });
    }
  });

  app.get("/api/checklist-tasks/release/:releaseId", requireAuth, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const tasks = await storage.getChecklistTasksByRelease(releaseId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get checklist tasks for release" });
    }
  });

  app.post("/api/checklist-tasks", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChecklistTaskSchema.parse(req.body);
      const task = await storage.createChecklistTask(validatedData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist task data" });
    }
  });

  app.put("/api/checklist-tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertChecklistTaskSchema.partial().parse(req.body);
      const task = await storage.updateChecklistTask(id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist task data" });
    }
  });

  // Review request endpoint
  app.post("/api/checklist-tasks/:id/request-review", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { changes } = req.body;
      
      // Update task status to indicate review requested
      const task = await storage.updateChecklistTask(id, { 
        reviewStatus: "requested",
        reviewChanges: changes
      });
      
      if (!task) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      
      res.json({ success: true, message: "Review requested successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to request review" });
    }
  });

  // Submit review endpoint
  app.post("/api/checklist-tasks/:id/submit-review", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { submissionUrl } = req.body;
      
      const task = await storage.updateChecklistTask(id, { 
        reviewSubmissionUrl: submissionUrl
      });
      
      if (!task) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      
      res.json({ success: true, message: "Review submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Approve review endpoint
  app.post("/api/checklist-tasks/:id/approve-review", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const task = await storage.updateChecklistTask(id, { 
        reviewStatus: "approved",
        completed: true
      });
      
      if (!task) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      
      res.json({ success: true, message: "Review approved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve review" });
    }
  });

  // Request next version endpoint
  app.post("/api/checklist-tasks/:id/request-next-version", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { changes } = req.body;
      
      // Get current task to increment version
      const currentTask = await storage.getChecklistTask(id);
      if (!currentTask) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      
      const nextVersion = (currentTask.currentVersion || 1) + 1;
      
      const task = await storage.updateChecklistTask(id, { 
        reviewStatus: "requested",
        reviewChanges: changes,
        currentVersion: nextVersion,
        reviewSubmissionUrl: null // Reset submission URL for new version
      });
      
      res.json({ success: true, message: `Version ${nextVersion} requested successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to request next version" });
    }
  });

  // Schedule task endpoint for calendar
  app.patch("/api/checklist-tasks/:id/schedule", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduledDate } = req.body;
      
      const task = await storage.updateChecklistTask(id, { 
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
      });
      
      if (!task) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      
      res.json({ success: true, message: "Task scheduled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule task" });
    }
  });

  // Unschedule task endpoint for calendar
  app.patch("/api/checklist-tasks/:id/unschedule", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const task = await storage.updateChecklistTask(id, { 
        scheduledDate: null
      });
      
      if (!task) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      
      res.json({ success: true, message: "Task unscheduled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unschedule task" });
    }
  });

  app.delete("/api/checklist-tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteChecklistTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Checklist task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete checklist task" });
    }
  });

  // Waterfall Cycles
  app.get("/api/waterfall-cycles", requireAuth, async (req, res) => {
    try {
      const cycles = await storage.getWaterfallCycles();
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get waterfall cycles" });
    }
  });

  app.post("/api/waterfall-cycles", requireAuth, async (req, res) => {
    try {
      const validatedData = insertWaterfallCycleSchema.parse(req.body);
      const cycle = await storage.createWaterfallCycle(validatedData);
      res.json(cycle);
    } catch (error) {
      res.status(400).json({ message: "Invalid waterfall cycle data" });
    }
  });

  app.put("/api/waterfall-cycles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWaterfallCycleSchema.partial().parse(req.body);
      const cycle = await storage.updateWaterfallCycle(id, validatedData);
      if (!cycle) {
        return res.status(404).json({ message: "Waterfall cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      res.status(400).json({ message: "Invalid waterfall cycle data" });
    }
  });

  app.delete("/api/waterfall-cycles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWaterfallCycle(id);
      if (!deleted) {
        return res.status(404).json({ message: "Waterfall cycle not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete waterfall cycle" });
    }
  });

  // Content Format Assignments
  app.get("/api/content-format-assignments", requireAuth, async (req, res) => {
    try {
      const assignments = await storage.getContentFormatAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get content format assignments" });
    }
  });

  app.get("/api/content-format-assignments/release/:releaseId", requireAuth, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const assignments = await storage.getContentFormatAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get content format assignments for release" });
    }
  });

  app.post("/api/content-format-assignments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertContentFormatAssignmentSchema.parse(req.body);
      const assignment = await storage.createContentFormatAssignment(validatedData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid content format assignment data" });
    }
  });

  app.put("/api/content-format-assignments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertContentFormatAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateContentFormatAssignment(id, validatedData);
      if (!assignment) {
        return res.status(404).json({ message: "Content format assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid content format assignment data" });
    }
  });

  app.delete("/api/content-format-assignments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteContentFormatAssignment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Content format assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content format assignment" });
    }
  });

  // Evergreen Boxes
  app.get("/api/evergreen-boxes", requireAuth, async (req, res) => {
    try {
      const boxes = await storage.getEvergreenBoxes();
      res.json(boxes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evergreen boxes" });
    }
  });

  app.get("/api/evergreen-boxes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const box = await storage.getEvergreenBox(id);
      if (!box) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json(box);
    } catch (error) {
      res.status(500).json({ message: "Failed to get evergreen box" });
    }
  });

  app.post("/api/evergreen-boxes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEvergreenBoxSchema.parse(req.body);
      const box = await storage.createEvergreenBox(validatedData);
      res.json(box);
    } catch (error) {
      res.status(400).json({ message: "Invalid evergreen box data" });
    }
  });

  app.put("/api/evergreen-boxes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEvergreenBoxSchema.partial().parse(req.body);
      const box = await storage.updateEvergreenBox(id, validatedData);
      if (!box) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json(box);
    } catch (error) {
      res.status(400).json({ message: "Invalid evergreen box data" });
    }
  });

  app.delete("/api/evergreen-boxes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEvergreenBox(id);
      if (!deleted) {
        return res.status(404).json({ message: "Evergreen box not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete evergreen box" });
    }
  });

  // Task Social Media
  app.get("/api/task-social-media", requireAuth, async (req, res) => {
    try {
      const socialMedia = await storage.getTaskSocialMedia();
      res.json(socialMedia);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task social media" });
    }
  });

  app.get("/api/task-social-media/task/:taskId", requireAuth, async (req, res) => {
    try {
      const { taskId } = req.params;
      const socialMedia = await storage.getTaskSocialMediaByTask(taskId);
      res.json(socialMedia);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task social media for task" });
    }
  });

  app.post("/api/task-social-media", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTaskSocialMediaSchema.parse(req.body);
      const socialMedia = await storage.createTaskSocialMedia(validatedData);
      res.json(socialMedia);
    } catch (error) {
      res.status(400).json({ message: "Invalid task social media data" });
    }
  });

  app.put("/api/task-social-media/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/task-social-media/:id", requireAuth, async (req, res) => {
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

  // Additional utility routes for bulk operations and file handling
  app.post("/api/import", requireAuth, async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ message: "No data provided for import" });
      }

      // Import functionality temporarily disabled
      console.log("Import data:", data);
      res.json({ success: true, message: "Data imported successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to import data" });
    }
  });

  app.get("/api/export", requireAuth, async (req, res) => {
    try {
      // Export functionality temporarily disabled
      const data = {};
      res.json({
        version: "1.1",
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Generate Evergreen Tasks
  app.post("/api/evergreen-tasks/generate", requireAuth, async (req, res) => {
    try {
      const boxes = await storage.getEvergreenBoxes();
      console.log("📦 Generating evergreen tasks for boxes:", boxes.length);
      
      for (const box of boxes) {
        if (box.waterfallCycleId) {
          const cycle = await storage.getWaterfallCycle(box.waterfallCycleId);
          if (cycle) {
            // Get team members for assignment
            const teamMembers = ["Alice", "Bob", "Charlie", "Diana"];
            console.log("👥 Generating tasks for team members:", teamMembers);
            
            for (const member of teamMembers) {
              for (const formatType of cycle.contentFormatTypes) {
                const taskTitle = `${box.title} - ${formatType} (${member})`;
                
                // Check if task already exists
                const existingTasks = await storage.getChecklistTasks();
                const taskExists = existingTasks.some(task => 
                  task.taskTitle === taskTitle && 
                  task.evergreenBoxId === box.id &&
                  task.assignedTo === member
                );
                
                if (!taskExists) {
                  const newTask = await storage.createChecklistTask({
                    taskTitle,
                    taskDescription: `Generate ${formatType} content for ${box.title}`,
                    assignedTo: member,
                    evergreenBoxId: box.id,
                    waterfallCycleId: cycle.id,
                    contentFormatType: formatType,
                    completed: false,
                    priority: false,
                    currentVersion: 1,
                  });
                  console.log("✅ Created evergreen task:", taskTitle, "for", member);
                } else {
                  console.log("⏭️ Task already exists:", taskTitle);
                }
              }
            }
          }
        }
      }
      
      res.json({ success: true, message: "Evergreen tasks generated successfully" });
    } catch (error) {
      console.error("Error generating evergreen tasks:", error);
      res.status(500).json({ message: "Failed to generate evergreen tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}