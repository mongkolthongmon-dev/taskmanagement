"use server";

import { revalidatePath } from "next/cache";
import { eq, not } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export type ActionResult = { error?: string };

// WRITE: insert a new task. Drizzle uses parameterized queries, so the
// user-provided title is safe from SQL injection.
export async function addTask(formData: FormData): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { error: "Task title cannot be empty." };
  }
  if (title.length > 280) {
    return { error: "Task title is too long (max 280 characters)." };
  }

  try {
    await db.insert(tasks).values({ title });
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("addTask failed:", err);
    return { error: "Could not save the task. Please try again." };
  }
}

// WRITE: edit a task's title.
export async function updateTask(
  id: number,
  rawTitle: string
): Promise<ActionResult> {
  const title = rawTitle.trim();

  if (!title) {
    return { error: "Task title cannot be empty." };
  }
  if (title.length > 280) {
    return { error: "Task title is too long (max 280 characters)." };
  }

  try {
    await db.update(tasks).set({ title }).where(eq(tasks.id, id));
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("updateTask failed:", err);
    return { error: "Could not update the task. Please try again." };
  }
}

// WRITE: flip a task's completed state.
export async function toggleTask(id: number): Promise<ActionResult> {
  try {
    await db
      .update(tasks)
      .set({ completed: not(tasks.completed) })
      .where(eq(tasks.id, id));
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("toggleTask failed:", err);
    return { error: "Could not update the task. Please try again." };
  }
}

// WRITE: delete a task.
export async function deleteTask(id: number): Promise<ActionResult> {
  try {
    await db.delete(tasks).where(eq(tasks.id, id));
    revalidatePath("/");
    return {};
  } catch (err) {
    console.error("deleteTask failed:", err);
    return { error: "Could not delete the task. Please try again." };
  }
}
