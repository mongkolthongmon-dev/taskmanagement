"use client";

import { useRef, useState, useTransition } from "react";
import { deleteTask, toggleTask, updateTask } from "@/app/actions";
import type { Task } from "@/db/schema";

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  function saveEdit() {
    const next = inputRef.current?.value ?? "";
    if (next.trim() === task.title) {
      setIsEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateTask(task.id, next);
      if (result?.error) {
        setError(result.error);
      } else {
        setIsEditing(false);
      }
    });
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        disabled={isPending || isEditing}
        onChange={() => run(() => toggleTask(task.id))}
        className="size-5 cursor-pointer accent-black dark:accent-white"
      />
      <div className="flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            defaultValue={task.title}
            maxLength={280}
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") {
                setError(null);
                setIsEditing(false);
              }
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-base text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsEditing(true);
            }}
            title="Click to edit"
            className={`block w-full text-left text-base ${
              task.completed
                ? "text-zinc-400 line-through dark:text-zinc-600"
                : "text-black dark:text-zinc-50"
            }`}
          >
            {task.title}
          </button>
        )}
        {error ? (
          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
        ) : null}
      </div>
      <time
        dateTime={new Date(task.createdAt).toISOString()}
        className="hidden text-xs text-zinc-400 sm:block dark:text-zinc-600"
      >
        {new Date(task.createdAt).toLocaleString()}
      </time>
      {isEditing ? (
        <>
          <button
            type="button"
            onClick={saveEdit}
            disabled={isPending}
            className="rounded-md px-2 py-1 text-sm text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-950"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsEditing(false);
            }}
            disabled={isPending}
            className="rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsEditing(true);
            }}
            disabled={isPending}
            aria-label="Edit task"
            className="rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-black disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => run(() => deleteTask(task.id))}
            disabled={isPending}
            aria-label="Delete task"
            className="rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </>
      )}
    </li>
  );
}
