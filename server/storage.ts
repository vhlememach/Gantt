import { type ReleaseGroup, type InsertReleaseGroup, type Release, type InsertRelease, type AppSettings, type InsertAppSettings, type ChecklistTask, type InsertChecklistTask } from "@shared/schema";
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
  getChecklistTasksByMember(assignedTo: string): Promise<ChecklistTask[]>;
  createChecklistTask(task: InsertChecklistTask): Promise<ChecklistTask>;
  updateChecklistTask(id: string, task: Partial<InsertChecklistTask>): Promise<ChecklistTask | undefined>;
  deleteChecklistTask(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private releaseGroups: Map<string, ReleaseGroup>;
  private releases: Map<string, Release>;
  private checklistTasks: Map<string, ChecklistTask>;
  private appSettings: AppSettings;

  constructor() {
    this.releaseGroups = new Map();
    this.releases = new Map();
    this.checklistTasks = new Map();
    this.appSettings = {
      id: randomUUID(),
      headerTitle: "Release Gantt Chart",
      headerBackgroundColor: "#3B82F6",
      headerTitleColor: "#FFFFFF",
      fontFamily: "Inter",
      buttonColor: "#8B5CF6",
      buttonStyle: "rounded",
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
        createdAt: new Date(),
      },
    ];

    releases.forEach(release => {
      this.releases.set(release.id, release);
    });

    // Initialize sample checklist tasks
    this.initializeSampleChecklistTasks(releases);
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
          const isPriority = Math.random() > 0.6; // 40% priority tasks
          const isCompleted = Math.random() > 0.7; // 30% completed randomly
          const task: ChecklistTask = {
            id: taskId,
            releaseId: release.id,
            assignedTo: member,
            taskTitle: `${sampleTasks[Math.floor(Math.random() * sampleTasks.length)]} - ${release.name}`,
            taskDescription: `${member}'s task for ${release.name}`,
            taskUrl: Math.random() > 0.5 ? `https://docs.example.com/${taskId}` : null,
            priority: isPriority,
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
      taskUrl: task.taskUrl || null,
      priority: task.priority || false,
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
}

export const storage = new MemStorage();
