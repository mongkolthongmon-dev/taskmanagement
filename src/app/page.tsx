import { desc } from "drizzle-orm";
import { db } from "@/db";
import { tasks as tasksTable, type Task } from "@/db/schema";
import { AddTaskForm } from "@/components/add-task-form";
import { TaskItem } from "@/components/task-item";

// Always render with fresh data from the database.
export const dynamic = "force-dynamic";

export default async function Home() {
  let tasks: Task[] = [];
  let loadError: string | null = null;

  // READ: fetch all tasks from Neon, newest first.
  try {
    tasks = await db
      .select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.createdAt));
  } catch (err) {
    console.error("Failed to load tasks:", err);
    loadError = "Could not reach the database. Please try again later.";
  }

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-2xl px-6 py-16">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Task Manager
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Backed by Neon serverless Postgres.
          </p>
        </header>

        <div className="mb-8">
          <AddTaskForm />
        </div>

        {loadError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {loadError}
          </p>
        ) : tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No tasks yet. Add your first one above.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              {remaining} of {tasks.length} remaining
            </p>
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
