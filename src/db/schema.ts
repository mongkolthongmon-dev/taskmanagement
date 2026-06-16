import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

// A single "tasks" table: a task list where users add, complete, and delete tasks.
// Requirement: a primary key (id) and a timestamp column (createdAt).
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
