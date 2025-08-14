import { 
  type ReleaseGroup, type InsertReleaseGroup, 
  type Release, type InsertRelease, 
  type AppSettings, type InsertAppSettings, 
  type ChecklistTask, type InsertChecklistTask,
  type WaterfallCycle, type InsertWaterfallCycle,
  type ContentFormatAssignment, type InsertContentFormatAssignment,
  type EvergreenBox, type InsertEvergreenBox,
  type TaskSocialMedia, type InsertTaskSocialMedia,
  type User, type InsertUser
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, releaseGroups, releases, appSettings, waterfallCycles, contentFormatAssignments, evergreenBoxes, taskSocialMedia, checklistTasks } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Release Groups
  getReleaseGroups(): Promise<ReleaseGroup[]>;
  getReleaseGroup(id: string): Promise<ReleaseGroup | undefined>;
  createReleaseGroup(group: InsertReleaseGroup): Promise<ReleaseGroup>;
  updateReleaseGroup(id: string, group: Partial<InsertReleaseGroup>): Promise<ReleaseGroup | undefined>;
  deleteReleaseGroup(id: string): Promise<boolean>;

  // Releases
  getReleases(): Promise<Release[]>;
  getRelease(id: string): Promise<Release | undefined>;
  getReleasesByGroupId(groupId: string): Promise<Release[]>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(id: string, release: Partial<InsertRelease>): Promise<Release | undefined>;
  deleteRelease(id: string): Promise<boolean>;

  // App Settings
  getAppSettings(): Promise<AppSettings>;
  updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings>;
  
  // Checklist Tasks
  getChecklistTasks(): Promise<ChecklistTask[]>;
  getChecklistTask(id: string): Promise<ChecklistTask | undefined>;
  getChecklistTasksByRelease(releaseId: string): Promise<ChecklistTask[]>;
  getChecklistTasksByEvergreenBox(evergreenBoxId: string): Promise<ChecklistTask[]>;
  getChecklistTasksByMember(assignedTo: string): Promise<ChecklistTask[]>;
  createChecklistTask(task: InsertChecklistTask): Promise<ChecklistTask>;
  updateChecklistTask(id: string, task: Partial<InsertChecklistTask>): Promise<ChecklistTask | undefined>;
  deleteChecklistTask(id: string): Promise<boolean>;

  // Waterfall Cycles
  getWaterfallCycles(): Promise<WaterfallCycle[]>;
  getWaterfallCycle(id: string): Promise<WaterfallCycle | undefined>;
  createWaterfallCycle(cycle: InsertWaterfallCycle): Promise<WaterfallCycle>;
  updateWaterfallCycle(id: string, cycle: Partial<InsertWaterfallCycle>): Promise<WaterfallCycle | undefined>;
  deleteWaterfallCycle(id: string): Promise<boolean>;

  // Content Format Assignments
  getContentFormatAssignments(): Promise<ContentFormatAssignment[]>;
  getContentFormatAssignment(id: string): Promise<ContentFormatAssignment | undefined>;
  createContentFormatAssignment(assignment: InsertContentFormatAssignment): Promise<ContentFormatAssignment>;
  updateContentFormatAssignment(id: string, assignment: Partial<InsertContentFormatAssignment>): Promise<ContentFormatAssignment | undefined>;
  deleteContentFormatAssignment(id: string): Promise<boolean>;

  // Evergreen Boxes
  getEvergreenBoxes(): Promise<EvergreenBox[]>;
  getEvergreenBox(id: string): Promise<EvergreenBox | undefined>;
  getEvergreenBoxesByGroup(groupId: string): Promise<EvergreenBox[]>;
  createEvergreenBox(box: InsertEvergreenBox): Promise<EvergreenBox>;
  updateEvergreenBox(id: string, box: Partial<InsertEvergreenBox>): Promise<EvergreenBox | undefined>;
  deleteEvergreenBox(id: string): Promise<boolean>;

  // Task Social Media
  getTaskSocialMedia(): Promise<TaskSocialMedia[]>;
  getTaskSocialMediaByTask(taskId: string): Promise<TaskSocialMedia | undefined>;
  createTaskSocialMedia(socialMedia: InsertTaskSocialMedia): Promise<TaskSocialMedia>;
  updateTaskSocialMedia(id: string, socialMedia: Partial<InsertTaskSocialMedia>): Promise<TaskSocialMedia | undefined>;
  deleteTaskSocialMedia(id: string): Promise<boolean>;

  // User Authentication
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: string, password: string): Promise<boolean>;
  deleteUser(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private releaseGroups: Map<string, ReleaseGroup>;
  private releases: Map<string, Release>;
  private checklistTasks: Map<string, ChecklistTask>;
  private waterfallCycles: Map<string, WaterfallCycle>;
  private contentFormatAssignments: Map<string, ContentFormatAssignment>;
  private evergreenBoxes: Map<string, EvergreenBox>;
  private taskSocialMedia: Map<string, TaskSocialMedia>;
  private appSettings: AppSettings;

  constructor() {
    this.releaseGroups = new Map();
    this.releases = new Map();
    this.checklistTasks = new Map();
    this.waterfallCycles = new Map();
    this.contentFormatAssignments = new Map();
    this.evergreenBoxes = new Map();
    this.taskSocialMedia = new Map();
    this.appSettings = {
      id: randomUUID(),
      headerTitle: "Palmyra",
      headerBackgroundColor: "#3B82F6",
      headerTitleColor: "#FFFFFF",
      fontFamily: "Inter",
      buttonColor: "#8B5CF6",
      buttonStyle: "rounded",
      currentDayLineColor: "#000000",
      currentDayLineThickness: 2,
      updatedAt: new Date(),
    };

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample groups
    const productGroup: ReleaseGroup = {
      id: randomUUID(),
      name: "Product",
      color: "#8B5CF6",
      gradientEnabled: "true",
      gradientSecondaryColor: "#DDD6FE",
      createdAt: new Date(),
    };

    const infraGroup: ReleaseGroup = {
      id: randomUUID(),
      name: "Infrastructure",
      color: "#10B981",
      gradientEnabled: "true",
      gradientSecondaryColor: "#D1FAE5",
      createdAt: new Date(),
    };

    this.releaseGroups.set(productGroup.id, productGroup);
    this.releaseGroups.set(infraGroup.id, infraGroup);

    // Create sample releases
    const releases: Release[] = [
      {
        id: randomUUID(),
        name: "Data Lake v2",
        description: "Next generation data lake infrastructure for improved analytics with enhanced machine learning capabilities, automated data pipeline integration, real-time processing, and comprehensive security features. This platform will serve as the foundation for all our data-driven initiatives and provide scalable solutions for business intelligence.",
        url: "https://docs.example.com/data-lake-v2",
        groupId: productGroup.id,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-03-20"),
        icon: "fas fa-database",
        responsible: "Sarah Johnson",
        status: "in-progress",
        highPriority: false,
        waterfallCycleId: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Mobile App v3.1",
        description: "Enhanced mobile experience with new features",
        url: "",
        groupId: productGroup.id,
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-04-15"),
        icon: "fas fa-mobile-alt",
        responsible: "Mike Chen",
        status: "upcoming",
        highPriority: false,
        waterfallCycleId: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Analytics Dashboard",
        description: "Real-time business intelligence dashboard",
        url: "",
        groupId: productGroup.id,
        startDate: new Date("2025-03-10"),
        endDate: new Date("2025-05-30"),
        icon: "fas fa-chart-line",
        responsible: "Emily Davis",
        status: "upcoming",
        highPriority: false,
        waterfallCycleId: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "AWS Migration",
        description: "Complete infrastructure migration to AWS cloud",
        url: "",
        groupId: infraGroup.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
        icon: "fas fa-cloud",
        responsible: "Alex Turner",
        status: "in-progress",
        highPriority: false,
        waterfallCycleId: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "CI/CD Pipeline v2",
        description: "Automated deployment pipeline improvements",
        url: "",
        groupId: infraGroup.id,
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-07-15"),
        icon: "fas fa-cog",
        responsible: "David Wilson",
        status: "upcoming",
        highPriority: false,
        waterfallCycleId: null,
        createdAt: new Date(),
      },
    ];

    releases.forEach(release => {
      this.releases.set(release.id, release);
    });

    // Initialize sample waterfall cycles
    this.initializeSampleWaterfallCycles();

    // Initialize sample content format assignments
    this.initializeSampleContentFormatAssignments();

    // Initialize sample evergreen boxes
    this.initializeSampleEvergreenBoxes([productGroup, infraGroup]);

    // Initialize sample checklist tasks
    this.initializeSampleChecklistTasks(releases);
  }

  private initializeSampleWaterfallCycles() {
    const cycles: WaterfallCycle[] = [
      {
        id: randomUUID(),
        name: "Monthly Waterfall Cycle",
        description: "Comprehensive content creation for major releases",
        contentRequirements: {
          article: 1,
          thread: 1,
          video: 1,
          animation: 1,
          visual: 1
        },
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Weekly Waterfall Cycle",
        description: "Regular content creation for ongoing engagement",
        contentRequirements: {
          thread: 1,
          animation: 1,
          visual: 1
        },
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Simple Waterfall Cycle",
        description: "Minimal content creation for quick releases",
        contentRequirements: {
          thread: 1,
          visual: 1
        },
        createdAt: new Date(),
      },
    ];

    cycles.forEach(cycle => {
      this.waterfallCycles.set(cycle.id, cycle);
    });
  }

  private initializeSampleContentFormatAssignments() {
    const assignments: ContentFormatAssignment[] = [
      {
        id: randomUUID(),
        formatType: "article",
        assignedMembers: ["Brian", "Alex"],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        formatType: "thread",
        assignedMembers: ["Brian", "Alex", "Victor"],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        formatType: "video",
        assignedMembers: ["Lucas"],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        formatType: "animation",
        assignedMembers: ["Lucas", "Victor"],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        formatType: "visual",
        assignedMembers: ["Victor", "Alex"],
        createdAt: new Date(),
      },
    ];

    assignments.forEach(assignment => {
      this.contentFormatAssignments.set(assignment.id, assignment);
    });
  }

  private initializeSampleEvergreenBoxes(groups: ReleaseGroup[]) {
    const [productGroup, infraGroup] = groups;
    const cycleIds = Array.from(this.waterfallCycles.keys());
    
    const boxes: EvergreenBox[] = [
      {
        id: randomUUID(),
        title: "Social Media Call To Action",
        description: "Monthly social media engagement campaigns and follow prompts",
        responsible: "Brian",
        groupId: productGroup.id,
        waterfallCycleId: cycleIds[0], // Monthly cycle
        icon: "lucide-megaphone",
        url: "https://social.palmyra.com/campaigns",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Community Newsletter",
        description: "Weekly newsletter content and subscriber engagement",
        responsible: "Alex",
        groupId: productGroup.id,
        waterfallCycleId: cycleIds[1], // Weekly cycle
        icon: "lucide-mail",
        url: "https://newsletter.palmyra.com",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Technical Blog Posts",
        description: "Infrastructure insights and technical thought leadership",
        responsible: "Victor",
        groupId: infraGroup.id,
        waterfallCycleId: cycleIds[2], // Simple cycle
        icon: "lucide-file-text",
        url: null,
        createdAt: new Date(),
      },
    ];

    boxes.forEach(box => {
      this.evergreenBoxes.set(box.id, box);
    });
  }

  private initializeSampleChecklistTasks(releases: Release[]) {
    const teamMembers = ["Brian", "Alex", "Lucas", "Victor"];
    const sampleTasks = [
      "Design UI mockups",
      "Write technical documentation",
      "Set up development environment", 
      "Create test cases",
      "Review code implementation",
      "Perform quality assurance testing",
      "Update user documentation",
      "Deploy to staging environment"
    ];

    releases.forEach(release => {
      // Create a shuffled copy of tasks for this release to ensure uniqueness
      const availableTasks = [...sampleTasks];
      let taskIndex = 0;
      
      teamMembers.forEach(member => {
        // Create exactly 2 unique tasks per member per release
        const taskCount = 2;
        for (let i = 0; i < taskCount; i++) {
          // If we've run out of tasks, shuffle the array again
          if (taskIndex >= availableTasks.length) {
            // Shuffle the array to get different order
            for (let j = availableTasks.length - 1; j > 0; j--) {
              const k = Math.floor(Math.random() * (j + 1));
              [availableTasks[j], availableTasks[k]] = [availableTasks[k], availableTasks[j]];
            }
            taskIndex = 0;
          }
          
          const baseTask = availableTasks[taskIndex];
          taskIndex++;
          
          const taskTitle = `${baseTask} - ${release.name}`;
          const taskId = randomUUID();
          const isCompleted = Math.random() > 0.7; // 30% completed randomly
          
          const task: ChecklistTask = {
            id: taskId,
            releaseId: release.id,
            evergreenBoxId: null,
            assignedTo: member,
            taskTitle: taskTitle,
            taskDescription: `${member}'s task for ${release.name}`,
            taskUrl: Math.random() > 0.5 ? `https://docs.example.com/${taskId}` : null,
            priority: false, // Priority is determined by release.highPriority
            waterfallCycleId: null,
            contentFormatType: null,
            completed: isCompleted,
            createdAt: new Date(),
            completedAt: isCompleted ? new Date() : null,
          };
          this.checklistTasks.set(taskId, task);
        }
      });
    });
  }

  // Release Groups
  async getReleaseGroups(): Promise<ReleaseGroup[]> {
    return Array.from(this.releaseGroups.values());
  }

  async getReleaseGroup(id: string): Promise<ReleaseGroup | undefined> {
    return this.releaseGroups.get(id);
  }

  async createReleaseGroup(group: InsertReleaseGroup): Promise<ReleaseGroup> {
    const id = randomUUID();
    const newGroup: ReleaseGroup = {
      ...group,
      id,
      gradientEnabled: group.gradientEnabled || "true",
      gradientSecondaryColor: group.gradientSecondaryColor || "#FFFFFF",
      createdAt: new Date(),
    };
    this.releaseGroups.set(id, newGroup);
    return newGroup;
  }

  async updateReleaseGroup(id: string, group: Partial<InsertReleaseGroup>): Promise<ReleaseGroup | undefined> {
    const existing = this.releaseGroups.get(id);
    if (!existing) return undefined;

    const updated: ReleaseGroup = { ...existing, ...group };
    this.releaseGroups.set(id, updated);
    return updated;
  }

  async deleteReleaseGroup(id: string): Promise<boolean> {
    // First delete all releases in this group
    const releases = await this.getReleasesByGroupId(id);
    releases.forEach(release => {
      this.releases.delete(release.id);
    });

    return this.releaseGroups.delete(id);
  }

  // Releases
  async getReleases(): Promise<Release[]> {
    return Array.from(this.releases.values());
  }

  async getRelease(id: string): Promise<Release | undefined> {
    return this.releases.get(id);
  }

  async getReleasesByGroupId(groupId: string): Promise<Release[]> {
    return Array.from(this.releases.values()).filter(release => release.groupId === groupId);
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    const id = randomUUID();
    const newRelease: Release = {
      ...release,
      id,
      createdAt: new Date(),
      status: release.status || "upcoming",
      description: release.description || "",
      url: release.url || "",
      responsible: release.responsible || "",
      icon: release.icon || "lucide-rocket",
      highPriority: release.highPriority || false,
      waterfallCycleId: release.waterfallCycleId || null,
    };
    this.releases.set(id, newRelease);
    return newRelease;
  }

  async updateRelease(id: string, release: Partial<InsertRelease>): Promise<Release | undefined> {
    const existing = this.releases.get(id);
    if (!existing) return undefined;

    const updated: Release = { ...existing, ...release };
    this.releases.set(id, updated);
    return updated;
  }

  async deleteRelease(id: string): Promise<boolean> {
    return this.releases.delete(id);
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    return this.appSettings;
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    this.appSettings = {
      ...this.appSettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.appSettings;
  }

  // Checklist Tasks
  async getChecklistTasks(): Promise<ChecklistTask[]> {
    return Array.from(this.checklistTasks.values());
  }

  async getChecklistTask(id: string): Promise<ChecklistTask | undefined> {
    return this.checklistTasks.get(id);
  }

  async getChecklistTasksByRelease(releaseId: string): Promise<ChecklistTask[]> {
    return Array.from(this.checklistTasks.values()).filter(task => task.releaseId === releaseId);
  }

  async getChecklistTasksByMember(assignedTo: string): Promise<ChecklistTask[]> {
    return Array.from(this.checklistTasks.values()).filter(task => task.assignedTo === assignedTo);
  }

  async createChecklistTask(task: InsertChecklistTask): Promise<ChecklistTask> {
    const id = randomUUID();
    const newTask: ChecklistTask = {
      ...task,
      id,
      releaseId: task.releaseId || null,
      evergreenBoxId: task.evergreenBoxId || null,
      taskDescription: task.taskDescription || null,
      taskUrl: task.taskUrl || null,
      priority: task.priority || false,
      waterfallCycleId: task.waterfallCycleId || null,
      contentFormatType: task.contentFormatType || null,
      completed: task.completed || false,
      createdAt: new Date(),
      completedAt: null,
    };
    this.checklistTasks.set(id, newTask);
    return newTask;
  }

  async updateChecklistTask(id: string, task: Partial<InsertChecklistTask>): Promise<ChecklistTask | undefined> {
    const existing = this.checklistTasks.get(id);
    if (!existing) return undefined;

    const updated: ChecklistTask = { 
      ...existing, 
      ...task,
      completedAt: task.completed ? new Date() : (task.completed === false ? null : existing.completedAt)
    };
    this.checklistTasks.set(id, updated);
    return updated;
  }

  async deleteChecklistTask(id: string): Promise<boolean> {
    return this.checklistTasks.delete(id);
  }

  async getChecklistTasksByEvergreenBox(evergreenBoxId: string): Promise<ChecklistTask[]> {
    return Array.from(this.checklistTasks.values()).filter(task => task.evergreenBoxId === evergreenBoxId);
  }

  // Waterfall Cycles
  async getWaterfallCycles(): Promise<WaterfallCycle[]> {
    return Array.from(this.waterfallCycles.values());
  }

  async getWaterfallCycle(id: string): Promise<WaterfallCycle | undefined> {
    return this.waterfallCycles.get(id);
  }

  async createWaterfallCycle(cycle: InsertWaterfallCycle): Promise<WaterfallCycle> {
    const id = randomUUID();
    const newCycle: WaterfallCycle = {
      ...cycle,
      id,
      description: cycle.description || null,
      createdAt: new Date(),
    };
    this.waterfallCycles.set(id, newCycle);
    return newCycle;
  }

  async updateWaterfallCycle(id: string, cycle: Partial<InsertWaterfallCycle>): Promise<WaterfallCycle | undefined> {
    const existing = this.waterfallCycles.get(id);
    if (!existing) return undefined;

    const updated: WaterfallCycle = { ...existing, ...cycle };
    this.waterfallCycles.set(id, updated);
    return updated;
  }

  async deleteWaterfallCycle(id: string): Promise<boolean> {
    return this.waterfallCycles.delete(id);
  }

  // Content Format Assignments
  async getContentFormatAssignments(): Promise<ContentFormatAssignment[]> {
    return Array.from(this.contentFormatAssignments.values());
  }

  async getContentFormatAssignment(id: string): Promise<ContentFormatAssignment | undefined> {
    return this.contentFormatAssignments.get(id);
  }

  async createContentFormatAssignment(assignment: InsertContentFormatAssignment): Promise<ContentFormatAssignment> {
    const id = randomUUID();
    const newAssignment: ContentFormatAssignment = {
      ...assignment,
      id,
      createdAt: new Date(),
    };
    this.contentFormatAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async updateContentFormatAssignment(id: string, assignment: Partial<InsertContentFormatAssignment>): Promise<ContentFormatAssignment | undefined> {
    const existing = this.contentFormatAssignments.get(id);
    if (!existing) return undefined;

    const updated: ContentFormatAssignment = { ...existing, ...assignment };
    this.contentFormatAssignments.set(id, updated);
    return updated;
  }

  async deleteContentFormatAssignment(id: string): Promise<boolean> {
    return this.contentFormatAssignments.delete(id);
  }

  // Evergreen Boxes
  async getEvergreenBoxes(): Promise<EvergreenBox[]> {
    return Array.from(this.evergreenBoxes.values());
  }

  async getEvergreenBox(id: string): Promise<EvergreenBox | undefined> {
    return this.evergreenBoxes.get(id);
  }

  async getEvergreenBoxesByGroup(groupId: string): Promise<EvergreenBox[]> {
    return Array.from(this.evergreenBoxes.values()).filter(box => box.groupId === groupId);
  }

  async createEvergreenBox(box: InsertEvergreenBox): Promise<EvergreenBox> {
    const id = randomUUID();
    const newBox: EvergreenBox = {
      ...box,
      id,
      description: box.description || "",
      responsible: box.responsible || "",
      icon: box.icon || "lucide-box",
      waterfallCycleId: box.waterfallCycleId || null,
      url: box.url || null,
      createdAt: new Date(),
    };
    this.evergreenBoxes.set(id, newBox);
    return newBox;
  }

  async updateEvergreenBox(id: string, box: Partial<InsertEvergreenBox>): Promise<EvergreenBox | undefined> {
    const existing = this.evergreenBoxes.get(id);
    if (!existing) return undefined;

    const updated: EvergreenBox = { ...existing, ...box };
    this.evergreenBoxes.set(id, updated);
    return updated;
  }

  async deleteEvergreenBox(id: string): Promise<boolean> {
    return this.evergreenBoxes.delete(id);
  }

  // Task Social Media
  async getTaskSocialMedia(): Promise<TaskSocialMedia[]> {
    return Array.from(this.taskSocialMedia.values());
  }

  async getTaskSocialMediaByTask(taskId: string): Promise<TaskSocialMedia | undefined> {
    return Array.from(this.taskSocialMedia.values()).find(sm => sm.taskId === taskId);
  }

  async createTaskSocialMedia(socialMedia: InsertTaskSocialMedia): Promise<TaskSocialMedia> {
    const id = randomUUID();
    const newSocialMedia: TaskSocialMedia = {
      ...socialMedia,
      id,
      createdAt: new Date(),
    };
    this.taskSocialMedia.set(id, newSocialMedia);
    return newSocialMedia;
  }

  async updateTaskSocialMedia(id: string, socialMedia: Partial<InsertTaskSocialMedia>): Promise<TaskSocialMedia | undefined> {
    const existing = this.taskSocialMedia.get(id);
    if (!existing) return undefined;

    const updated: TaskSocialMedia = { ...existing, ...socialMedia };
    this.taskSocialMedia.set(id, updated);
    return updated;
  }

  async deleteTaskSocialMedia(id: string): Promise<boolean> {
    return this.taskSocialMedia.delete(id);
  }

  // User Authentication methods (for interface compliance)
  async getUsers(): Promise<User[]> {
    throw new Error("User authentication not supported in MemStorage");
  }

  async getUser(id: string): Promise<User | undefined> {
    throw new Error("User authentication not supported in MemStorage");
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("User authentication not supported in MemStorage");
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error("User authentication not supported in MemStorage");
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    throw new Error("User authentication not supported in MemStorage");
  }

  async updateUserPassword(id: string, password: string): Promise<boolean> {
    throw new Error("User authentication not supported in MemStorage");
  }

  async deleteUser(id: string): Promise<boolean> {
    throw new Error("User authentication not supported in MemStorage");
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User Authentication
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db
      .insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...user };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserPassword(id: string, password: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // All other methods delegate to MemStorage for now
  private memStorage = new MemStorage();

  async getReleaseGroups(): Promise<ReleaseGroup[]> {
    return this.memStorage.getReleaseGroups();
  }

  async getReleaseGroup(id: string): Promise<ReleaseGroup | undefined> {
    return this.memStorage.getReleaseGroup(id);
  }

  async createReleaseGroup(group: InsertReleaseGroup): Promise<ReleaseGroup> {
    return this.memStorage.createReleaseGroup(group);
  }

  async updateReleaseGroup(id: string, group: Partial<InsertReleaseGroup>): Promise<ReleaseGroup | undefined> {
    return this.memStorage.updateReleaseGroup(id, group);
  }

  async deleteReleaseGroup(id: string): Promise<boolean> {
    return this.memStorage.deleteReleaseGroup(id);
  }

  async getReleases(): Promise<Release[]> {
    return this.memStorage.getReleases();
  }

  async getRelease(id: string): Promise<Release | undefined> {
    return this.memStorage.getRelease(id);
  }

  async getReleasesByGroupId(groupId: string): Promise<Release[]> {
    return this.memStorage.getReleasesByGroupId(groupId);
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    return this.memStorage.createRelease(release);
  }

  async updateRelease(id: string, release: Partial<InsertRelease>): Promise<Release | undefined> {
    return this.memStorage.updateRelease(id, release);
  }

  async deleteRelease(id: string): Promise<boolean> {
    return this.memStorage.deleteRelease(id);
  }

  async getAppSettings(): Promise<AppSettings> {
    return this.memStorage.getAppSettings();
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    return this.memStorage.updateAppSettings(settings);
  }

  async getChecklistTasks(): Promise<ChecklistTask[]> {
    return this.memStorage.getChecklistTasks();
  }

  async getChecklistTask(id: string): Promise<ChecklistTask | undefined> {
    return this.memStorage.getChecklistTask(id);
  }

  async getChecklistTasksByRelease(releaseId: string): Promise<ChecklistTask[]> {
    return this.memStorage.getChecklistTasksByRelease(releaseId);
  }

  async getChecklistTasksByEvergreenBox(evergreenBoxId: string): Promise<ChecklistTask[]> {
    return this.memStorage.getChecklistTasksByEvergreenBox(evergreenBoxId);
  }

  async getChecklistTasksByMember(assignedTo: string): Promise<ChecklistTask[]> {
    return this.memStorage.getChecklistTasksByMember(assignedTo);
  }

  async createChecklistTask(task: InsertChecklistTask): Promise<ChecklistTask> {
    return this.memStorage.createChecklistTask(task);
  }

  async updateChecklistTask(id: string, task: Partial<InsertChecklistTask>): Promise<ChecklistTask | undefined> {
    return this.memStorage.updateChecklistTask(id, task);
  }

  async deleteChecklistTask(id: string): Promise<boolean> {
    return this.memStorage.deleteChecklistTask(id);
  }

  async getWaterfallCycles(): Promise<WaterfallCycle[]> {
    return this.memStorage.getWaterfallCycles();
  }

  async getWaterfallCycle(id: string): Promise<WaterfallCycle | undefined> {
    return this.memStorage.getWaterfallCycle(id);
  }

  async createWaterfallCycle(cycle: InsertWaterfallCycle): Promise<WaterfallCycle> {
    return this.memStorage.createWaterfallCycle(cycle);
  }

  async updateWaterfallCycle(id: string, cycle: Partial<InsertWaterfallCycle>): Promise<WaterfallCycle | undefined> {
    return this.memStorage.updateWaterfallCycle(id, cycle);
  }

  async deleteWaterfallCycle(id: string): Promise<boolean> {
    return this.memStorage.deleteWaterfallCycle(id);
  }

  async getContentFormatAssignments(): Promise<ContentFormatAssignment[]> {
    return this.memStorage.getContentFormatAssignments();
  }

  async getContentFormatAssignment(id: string): Promise<ContentFormatAssignment | undefined> {
    return this.memStorage.getContentFormatAssignment(id);
  }

  async createContentFormatAssignment(assignment: InsertContentFormatAssignment): Promise<ContentFormatAssignment> {
    return this.memStorage.createContentFormatAssignment(assignment);
  }

  async updateContentFormatAssignment(id: string, assignment: Partial<InsertContentFormatAssignment>): Promise<ContentFormatAssignment | undefined> {
    return this.memStorage.updateContentFormatAssignment(id, assignment);
  }

  async deleteContentFormatAssignment(id: string): Promise<boolean> {
    return this.memStorage.deleteContentFormatAssignment(id);
  }

  async getEvergreenBoxes(): Promise<EvergreenBox[]> {
    return this.memStorage.getEvergreenBoxes();
  }

  async getEvergreenBox(id: string): Promise<EvergreenBox | undefined> {
    return this.memStorage.getEvergreenBox(id);
  }

  async getEvergreenBoxesByGroup(groupId: string): Promise<EvergreenBox[]> {
    return this.memStorage.getEvergreenBoxesByGroup(groupId);
  }

  async createEvergreenBox(box: InsertEvergreenBox): Promise<EvergreenBox> {
    return this.memStorage.createEvergreenBox(box);
  }

  async updateEvergreenBox(id: string, box: Partial<InsertEvergreenBox>): Promise<EvergreenBox | undefined> {
    return this.memStorage.updateEvergreenBox(id, box);
  }

  async deleteEvergreenBox(id: string): Promise<boolean> {
    return this.memStorage.deleteEvergreenBox(id);
  }

  async getTaskSocialMedia(): Promise<TaskSocialMedia[]> {
    return this.memStorage.getTaskSocialMedia();
  }

  async getTaskSocialMediaByTask(taskId: string): Promise<TaskSocialMedia | undefined> {
    return this.memStorage.getTaskSocialMediaByTask(taskId);
  }

  async createTaskSocialMedia(socialMedia: InsertTaskSocialMedia): Promise<TaskSocialMedia> {
    return this.memStorage.createTaskSocialMedia(socialMedia);
  }

  async updateTaskSocialMedia(id: string, socialMedia: Partial<InsertTaskSocialMedia>): Promise<TaskSocialMedia | undefined> {
    return this.memStorage.updateTaskSocialMedia(id, socialMedia);
  }

  async deleteTaskSocialMedia(id: string): Promise<boolean> {
    return this.memStorage.deleteTaskSocialMedia(id);
  }
}

export const storage = new DatabaseStorage();
