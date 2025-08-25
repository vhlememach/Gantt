import { 
  type ReleaseGroup, type InsertReleaseGroup, 
  type Release, type InsertRelease, 
  type AppSettings, type InsertAppSettings, 
  type ChecklistTask, type InsertChecklistTask,
  type WaterfallCycle, type InsertWaterfallCycle,
  type ContentFormatAssignment, type InsertContentFormatAssignment,
  type EvergreenBox, type InsertEvergreenBox,
  type TaskSocialMedia, type InsertTaskSocialMedia,
  releaseGroups, releases, appSettings, checklistTasks, evergreenBoxes, 
  waterfallCycles, contentFormatAssignments, taskSocialMedia
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
  getContentFormatAssignmentsByWaterfallCycle(waterfallCycleId: string): Promise<ContentFormatAssignment[]>;
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
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database storage - no need for in-memory maps
  }

  // Release Groups  
  async getReleaseGroups(): Promise<ReleaseGroup[]> {
    return await db.select().from(releaseGroups);
  }

  async getReleaseGroup(id: string): Promise<ReleaseGroup | undefined> {
    const [group] = await db.select().from(releaseGroups).where(eq(releaseGroups.id, id));
    return group || undefined;
  }

  async createReleaseGroup(group: InsertReleaseGroup): Promise<ReleaseGroup> {
    const [newGroup] = await db.insert(releaseGroups).values(group).returning();
    return newGroup;
  }

  async updateReleaseGroup(id: string, group: Partial<InsertReleaseGroup>): Promise<ReleaseGroup | undefined> {
    const [updated] = await db.update(releaseGroups)
      .set(group)
      .where(eq(releaseGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteReleaseGroup(id: string): Promise<boolean> {
    const result = await db.delete(releaseGroups).where(eq(releaseGroups.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Releases
  async getReleases(): Promise<Release[]> {
    return await db.select().from(releases);
  }

  async getRelease(id: string): Promise<Release | undefined> {
    const [release] = await db.select().from(releases).where(eq(releases.id, id));
    return release || undefined;
  }

  async getReleasesByGroupId(groupId: string): Promise<Release[]> {
    return await db.select().from(releases).where(eq(releases.groupId, groupId));
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    // Convert empty strings to null for foreign key fields
    const cleanedRelease = {
      ...release,
      waterfallCycleId: release.waterfallCycleId === "" ? null : release.waterfallCycleId
    };
    const [newRelease] = await db.insert(releases).values(cleanedRelease).returning();
    return newRelease;
  }

  async updateRelease(id: string, release: Partial<InsertRelease>): Promise<Release | undefined> {
    // Convert empty strings to null for foreign key fields
    const cleanedRelease = {
      ...release,
      ...(release.waterfallCycleId !== undefined && { waterfallCycleId: release.waterfallCycleId === "" ? null : release.waterfallCycleId }),
      // Update the updatedAt timestamp to ensure recently updated projects appear at top
      updatedAt: new Date()
    };
    const [updated] = await db.update(releases)
      .set(cleanedRelease)
      .where(eq(releases.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRelease(id: string): Promise<boolean> {
    const result = await db.delete(releases).where(eq(releases.id, id));
    return (result.rowCount || 0) > 0;
  }



  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    const [settings] = await db.select().from(appSettings).limit(1);
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
        headerTitle: "Palmyra Marketing",
        headerBackgroundColor: "#3B82F6",
        headerTitleColor: "#FFFFFF",
        fontFamily: "Inter",
        buttonColor: "#8B5CF6",
        buttonStyle: "rounded",
        currentDayLineColor: "#000000",
        currentDayLineThickness: 2,
      };
      const [newSettings] = await db.insert(appSettings).values(defaultSettings).returning();
      return newSettings;
    }
    return settings;
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    const current = await this.getAppSettings();
    const [updated] = await db.update(appSettings)
      .set(settings)
      .where(eq(appSettings.id, current.id))
      .returning();
    return updated;
  }

  // Checklist Tasks
  async getChecklistTasks(): Promise<ChecklistTask[]> {
    return await db.select().from(checklistTasks);
  }

  async getChecklistTask(id: string): Promise<ChecklistTask | undefined> {
    const [task] = await db.select().from(checklistTasks).where(eq(checklistTasks.id, id));
    return task || undefined;
  }

  async getChecklistTasksByRelease(releaseId: string): Promise<ChecklistTask[]> {
    return await db.select().from(checklistTasks).where(eq(checklistTasks.releaseId, releaseId));
  }

  async getChecklistTasksByEvergreenBox(evergreenBoxId: string): Promise<ChecklistTask[]> {
    return await db.select().from(checklistTasks).where(eq(checklistTasks.evergreenBoxId, evergreenBoxId));
  }

  async getChecklistTasksByMember(assignedTo: string): Promise<ChecklistTask[]> {
    return await db.select().from(checklistTasks).where(eq(checklistTasks.assignedTo, assignedTo));
  }

  async createChecklistTask(task: InsertChecklistTask): Promise<ChecklistTask> {
    // Convert empty strings to null for foreign key fields  
    const cleanedTask: InsertChecklistTask = {
      ...task,
      releaseId: task.releaseId === "" || task.releaseId === "general" ? null : task.releaseId,
      evergreenBoxId: task.evergreenBoxId === "" || task.evergreenBoxId === null ? null : task.evergreenBoxId,
      waterfallCycleId: task.waterfallCycleId === "" || task.waterfallCycleId === null ? null : task.waterfallCycleId,
    };
    const [newTask] = await db.insert(checklistTasks).values(cleanedTask).returning();
    return newTask;
  }

  async updateChecklistTask(id: string, task: Partial<InsertChecklistTask>): Promise<ChecklistTask | undefined> {
    // Convert empty strings to null for foreign key fields
    const cleanedTask = {
      ...task,
      ...(task.releaseId !== undefined && { releaseId: task.releaseId === "" ? null : task.releaseId }),
      ...(task.evergreenBoxId !== undefined && { evergreenBoxId: task.evergreenBoxId === "" ? null : task.evergreenBoxId }),
      ...(task.waterfallCycleId !== undefined && { waterfallCycleId: task.waterfallCycleId === "" ? null : task.waterfallCycleId })
    };
    const [updated] = await db.update(checklistTasks)
      .set(cleanedTask)
      .where(eq(checklistTasks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteChecklistTask(id: string): Promise<boolean> {
    const result = await db.delete(checklistTasks).where(eq(checklistTasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Waterfall Cycles
  async getWaterfallCycles(): Promise<WaterfallCycle[]> {
    return await db.select().from(waterfallCycles);
  }

  async getWaterfallCycle(id: string): Promise<WaterfallCycle | undefined> {
    const [cycle] = await db.select().from(waterfallCycles).where(eq(waterfallCycles.id, id));
    return cycle || undefined;
  }

  async createWaterfallCycle(cycle: InsertWaterfallCycle): Promise<WaterfallCycle> {
    const [newCycle] = await db.insert(waterfallCycles).values(cycle).returning();
    return newCycle;
  }

  async updateWaterfallCycle(id: string, cycle: Partial<InsertWaterfallCycle>): Promise<WaterfallCycle | undefined> {
    const [updated] = await db.update(waterfallCycles)
      .set(cycle)
      .where(eq(waterfallCycles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWaterfallCycle(id: string): Promise<boolean> {
    try {
      // First, update all releases that reference this waterfall cycle to remove the reference
      await db.update(releases)
        .set({ waterfallCycleId: null })
        .where(eq(releases.waterfallCycleId, id));

      // Update all checklist tasks that reference this waterfall cycle to remove the reference  
      await db.update(checklistTasks)
        .set({ waterfallCycleId: null })
        .where(eq(checklistTasks.waterfallCycleId, id));

      // Update all evergreen boxes that reference this waterfall cycle to remove the reference
      await db.update(evergreenBoxes)
        .set({ waterfallCycleId: null })
        .where(eq(evergreenBoxes.waterfallCycleId, id));

      // Now delete the waterfall cycle
      const result = await db.delete(waterfallCycles).where(eq(waterfallCycles.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting waterfall cycle:', error);
      throw error;
    }
  }

  // Content Format Assignments
  async getContentFormatAssignments(): Promise<ContentFormatAssignment[]> {
    return await db.select().from(contentFormatAssignments);
  }

  async getContentFormatAssignmentsByWaterfallCycle(waterfallCycleId: string): Promise<ContentFormatAssignment[]> {
    return await db.select().from(contentFormatAssignments).where(eq(contentFormatAssignments.formatType, waterfallCycleId));
  }

  async createContentFormatAssignment(assignment: InsertContentFormatAssignment): Promise<ContentFormatAssignment> {
    const [newAssignment] = await db.insert(contentFormatAssignments).values(assignment).returning();
    return newAssignment;
  }

  async updateContentFormatAssignment(id: string, assignment: Partial<InsertContentFormatAssignment>): Promise<ContentFormatAssignment | undefined> {
    const [updated] = await db.update(contentFormatAssignments)
      .set(assignment)
      .where(eq(contentFormatAssignments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContentFormatAssignment(id: string): Promise<boolean> {
    const result = await db.delete(contentFormatAssignments).where(eq(contentFormatAssignments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Evergreen Boxes
  async getEvergreenBoxes(): Promise<EvergreenBox[]> {
    return await db.select().from(evergreenBoxes);
  }

  async getEvergreenBox(id: string): Promise<EvergreenBox | undefined> {
    const [box] = await db.select().from(evergreenBoxes).where(eq(evergreenBoxes.id, id));
    return box || undefined;
  }

  async getEvergreenBoxesByGroup(groupId: string): Promise<EvergreenBox[]> {
    return await db.select().from(evergreenBoxes).where(eq(evergreenBoxes.groupId, groupId));
  }

  async createEvergreenBox(box: InsertEvergreenBox): Promise<EvergreenBox> {
    // Convert empty strings to null for foreign key fields
    const cleanedBox = {
      ...box,
      waterfallCycleId: box.waterfallCycleId === "" ? null : box.waterfallCycleId
    };
    const [newBox] = await db.insert(evergreenBoxes).values(cleanedBox).returning();
    return newBox;
  }

  async updateEvergreenBox(id: string, box: Partial<InsertEvergreenBox>): Promise<EvergreenBox | undefined> {
    // Convert empty strings to null for foreign key fields
    const cleanedBox = {
      ...box,
      ...(box.waterfallCycleId !== undefined && { waterfallCycleId: box.waterfallCycleId === "" ? null : box.waterfallCycleId })
    };
    const [updated] = await db.update(evergreenBoxes)
      .set(cleanedBox)
      .where(eq(evergreenBoxes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEvergreenBox(id: string): Promise<boolean> {
    const result = await db.delete(evergreenBoxes).where(eq(evergreenBoxes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Task Social Media
  async getTaskSocialMedia(): Promise<TaskSocialMedia[]> {
    return await db.select().from(taskSocialMedia);
  }

  async getTaskSocialMediaByTask(taskId: string): Promise<TaskSocialMedia | undefined> {
    const [social] = await db.select().from(taskSocialMedia).where(eq(taskSocialMedia.taskId, taskId));
    return social || undefined;
  }

  async createTaskSocialMedia(socialMedia: InsertTaskSocialMedia): Promise<TaskSocialMedia> {
    const [newSocial] = await db.insert(taskSocialMedia).values(socialMedia).returning();
    return newSocial;
  }

  async updateTaskSocialMedia(id: string, socialMedia: Partial<InsertTaskSocialMedia>): Promise<TaskSocialMedia | undefined> {
    const [updated] = await db.update(taskSocialMedia)
      .set(socialMedia)
      .where(eq(taskSocialMedia.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTaskSocialMedia(id: string): Promise<boolean> {
    const result = await db.delete(taskSocialMedia).where(eq(taskSocialMedia.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();