import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const releaseGroups = pgTable("release_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const releases = pgTable("releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  groupId: varchar("group_id").notNull().references(() => releaseGroups.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  icon: text("icon").notNull().default("fas fa-rocket"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  headerTitle: text("header_title").notNull().default("Release Gantt Chart"),
  headerBackgroundColor: text("header_background_color").notNull().default("#3B82F6"),
  fontFamily: text("font_family").notNull().default("Inter"),
  buttonColor: text("button_color").notNull().default("#8B5CF6"),
  buttonStyle: text("button_style").notNull().default("rounded"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReleaseGroupSchema = createInsertSchema(releaseGroups).omit({
  id: true,
  createdAt: true,
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertReleaseGroup = z.infer<typeof insertReleaseGroupSchema>;
export type ReleaseGroup = typeof releaseGroups.$inferSelect;

export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
