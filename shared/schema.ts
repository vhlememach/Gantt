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
  responsible: text("responsible").default(""),
  status: text("status").notNull().default("upcoming"), // upcoming, in-progress, completed, delayed
  highPriority: boolean("high_priority").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  headerTitle: text("header_title").notNull().default("Release Gantt Chart"),
  headerBackgroundColor: text("header_background_color").notNull().default("#3B82F6"),
  headerTitleColor: text("header_title_color").notNull().default("#FFFFFF"),
  fontFamily: text("font_family").notNull().default("Inter"),
  buttonColor: text("button_color").notNull().default("#8B5CF6"),
  buttonStyle: text("button_style").notNull().default("rounded"),
  currentDayLineColor: text("current_day_line_color").notNull().default("#000000"),
  currentDayLineThickness: integer("current_day_line_thickness").notNull().default(2),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Checklist tasks for marketing team members
export const checklistTasks = pgTable("checklist_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  releaseId: varchar("release_id").references(() => releases.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to").notNull(), // Brian, Alex, Lucas, Victor
  taskTitle: text("task_title").notNull(),
  taskDescription: text("task_description"),
  taskUrl: text("task_url"), // URL/Links field
  priority: boolean("priority").default(false), // High priority tasks
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertReleaseGroupSchema = createInsertSchema(releaseGroups).omit({
  id: true,
  createdAt: true,
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertChecklistTaskSchema = createInsertSchema(checklistTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertReleaseGroup = z.infer<typeof insertReleaseGroupSchema>;
export type ReleaseGroup = typeof releaseGroups.$inferSelect;

export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

export type InsertChecklistTask = z.infer<typeof insertChecklistTaskSchema>;
export type ChecklistTask = typeof checklistTasks.$inferSelect;
