import { 
  type ReleaseGroup, type InsertReleaseGroup, 
  type Release, type InsertRelease, 
  type AppSettings, type InsertAppSettings, 
  type ChecklistTask, type InsertChecklistTask,
  type WaterfallCycle, type InsertWaterfallCycle,
  type ContentFormatAssignment, type InsertContentFormatAssignment,
  type EvergreenBox, type InsertEvergreenBox
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private releaseGroups: Map<string, ReleaseGroup>;
  private releases: Map<string, Release>;
  private checklistTasks: Map<string, ChecklistTask>;
  private waterfallCycles: Map<string, WaterfallCycle>;
  private contentFormatAssignments: Map<string, ContentFormatAssignment>;
  private evergreenBoxes: Map<string, EvergreenBox>;
  private appSettings: AppSettings;

  constructor() {
    this.releaseGroups = new Map();
    this.releases = new Map();
    this.checklistTasks = new Map();
    this.waterfallCycles = new Map();
    this.contentFormatAssignments = new Map();
    this.evergreenBoxes = new Map();
    this.appSettings = {
      id: randomUUID(),
      headerTitle: "Release Gantt Chart",
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
      teamMembers.forEach(member => {
        // Create 2-3 tasks per member per release
        const taskCount = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < taskCount; i++) {
          const taskId = randomUUID();
          const isCompleted = Math.random() > 0.7; // 30% completed randomly
          const task: ChecklistTask = {
            id: taskId,
            releaseId: release.id,
            evergreenBoxId: null,
            assignedTo: member,
            taskTitle: `${sampleTasks[Math.floor(Math.random() * sampleTasks.length)]} - ${release.name}`,
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
}

export const storage = new MemStorage();
