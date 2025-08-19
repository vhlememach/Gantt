import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const releaseGroups = pgTable("release_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull(),
  gradientEnabled: text("gradient_enabled").notNull().default("true"),
  gradientSecondaryColor: text("gradient_secondary_color").notNull().default("#FFFFFF"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const releases = pgTable("releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").default(""),
  url: text("url").default(""), // URL for supplemental material
  groupId: varchar("group_id").notNull().references(() => releaseGroups.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  icon: text("icon").notNull().default("fas fa-rocket"),
  accountablePerson: text("accountable_person").default(""),
  responsible: text("responsible").default(""),
  status: text("status").notNull().default("upcoming"), // upcoming, in-progress, completed, delayed
  highPriority: boolean("high_priority").default(false).notNull(),
  waterfallCycleId: varchar("waterfall_cycle_id").references(() => waterfallCycles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  headerTitle: text("header_title").notNull().default("Palmyra Marketing"),
  headerBackgroundColor: text("header_background_color").notNull().default("#3B82F6"),
  headerTitleColor: text("header_title_color").notNull().default("#FFFFFF"),
  fontFamily: text("font_family").notNull().default("Inter"),
  buttonColor: text("button_color").notNull().default("#8B5CF6"),
  buttonStyle: text("button_style").notNull().default("rounded"),
  currentDayLineColor: text("current_day_line_color").notNull().default("#000000"),
  currentDayLineThickness: integer("current_day_line_thickness").notNull().default(2),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Waterfall cycle definitions
export const waterfallCycles = pgTable("waterfall_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Monthly, Weekly, Simple
  description: text("description"),
  contentRequirements: jsonb("content_requirements").notNull(), // {article: 1, thread: 1, video: 1, animation: 1, visual: 1}
  createdAt: timestamp("created_at").defaultNow(),
});

// Content format team assignments
export const contentFormatAssignments = pgTable("content_format_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formatType: text("format_type").notNull(), // article, thread, video, animation, visual
  assignedMembers: text("assigned_members").array().notNull(), // ["Brian", "Alex"] for articles, ["Lucas"] for videos
  createdAt: timestamp("created_at").defaultNow(),
});

// Evergreen content boxes
export const evergreenBoxes = pgTable("evergreen_boxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").default(""),
  responsible: text("responsible").default(""),
  groupId: varchar("group_id").notNull().references(() => releaseGroups.id, { onDelete: "cascade" }),
  waterfallCycleId: varchar("waterfall_cycle_id").references(() => waterfallCycles.id),
  icon: text("icon").notNull().default("lucide-box"),
  url: text("url"),
  highPriority: boolean("high_priority").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media platforms for tasks
export const taskSocialMedia = pgTable("task_social_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => checklistTasks.id, { onDelete: "cascade" }),
  platforms: text("platforms").array().notNull(), // ["X", "LinkedIn", "Youtube", etc.]
  linkUrl: text("link_url"), // Additional URL/Link field for social media tasks
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist tasks for marketing team members
export const checklistTasks = pgTable("checklist_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").references(() => releases.id, { onDelete: "cascade" }),
  evergreenBoxId: varchar("evergreen_box_id").references(() => evergreenBoxes.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to").notNull(), // Brian, Alex, Lucas, Victor
  taskTitle: text("task_title").notNull(),
  taskDescription: text("task_description"),
  taskUrl: text("task_url"), // URL/Links field
  priority: boolean("priority").default(false), // High priority tasks
  waterfallCycleId: varchar("waterfall_cycle_id").references(() => waterfallCycles.id),
  contentFormatType: text("content_format_type"), // article, thread, video, animation, visual
  completed: boolean("completed").default(false),
  paused: boolean("paused").default(false), // Task is paused due to blocker
  blockerReason: text("blocker_reason"), // Description of blocking issue
  blockerRequestedBy: text("blocker_requested_by"), // Who requested the blocking work
  scheduledDate: text("scheduled_date"), // Date when task is scheduled in calendar (YYYY-MM-DD)
  reviewStatus: text("review_status").default("none"), // none, requested, approved
  currentVersion: integer("current_version").default(1), // v1, v2, v3, v4, etc.
  reviewChanges: text("review_changes"), // Changes requested for review
  reviewSubmissionUrl: text("review_submission_url"), // URL submitted by team member for review
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReleaseGroupSchema = createInsertSchema(releaseGroups).omit({
  id: true,
  createdAt: true,
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  waterfallCycleId: z.string().nullable().optional().transform((val) => val === "" || val === undefined || val === null ? null : val),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertWaterfallCycleSchema = createInsertSchema(waterfallCycles).omit({
  id: true,
  createdAt: true,
});

export const insertContentFormatAssignmentSchema = createInsertSchema(contentFormatAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertEvergreenBoxSchema = createInsertSchema(evergreenBoxes).omit({
  id: true,
  createdAt: true,
}).extend({
  waterfallCycleId: z.string().optional().transform((val) => val === "" || val === undefined ? null : val),
});

export const insertTaskSocialMediaSchema = createInsertSchema(taskSocialMedia).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistTaskSchema = createInsertSchema(checklistTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  waterfallCycleId: z.string().nullable().optional().transform((val) => val === "" || val === undefined || val === null ? null : val),
  releaseId: z.string().nullable().optional().transform((val) => val === "" || val === undefined || val === null ? null : val),
  evergreenBoxId: z.string().nullable().optional().transform((val) => val === "" || val === undefined || val === null ? null : val),
});

export type InsertReleaseGroup = z.infer<typeof insertReleaseGroupSchema>;
export type ReleaseGroup = typeof releaseGroups.$inferSelect;

export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

export type InsertWaterfallCycle = z.infer<typeof insertWaterfallCycleSchema>;
export type WaterfallCycle = typeof waterfallCycles.$inferSelect;

export type InsertContentFormatAssignment = z.infer<typeof insertContentFormatAssignmentSchema>;
export type ContentFormatAssignment = typeof contentFormatAssignments.$inferSelect;

export type InsertEvergreenBox = z.infer<typeof insertEvergreenBoxSchema>;
export type EvergreenBox = typeof evergreenBoxes.$inferSelect;

export type InsertTaskSocialMedia = z.infer<typeof insertTaskSocialMediaSchema>;
export type TaskSocialMedia = typeof taskSocialMedia.$inferSelect;

export type InsertChecklistTask = z.infer<typeof insertChecklistTaskSchema>;
export type ChecklistTask = typeof checklistTasks.$inferSelect;
