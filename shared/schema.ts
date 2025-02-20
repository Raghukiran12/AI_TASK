
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "completed"] }).default("todo").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("low").notNull(),
  userId: integer("user_id").notNull(),
  dueDate: timestamp("due_date"),
  alertBefore: integer("alert_before"),
  alertUnit: text("alert_unit", { enum: ["minutes", "hours", "days"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  alertBefore: true,
  alertUnit: true,
});

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
