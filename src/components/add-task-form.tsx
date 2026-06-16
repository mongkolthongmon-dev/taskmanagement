"use client";

import { useActionState, useEffect, useRef } from "react";
import { addTask, type ActionResult } from "@/app/actions";

export function AddTaskForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => addTask(formData),
    {} as ActionResult
  );

  // Clear the input after a successful submit.
  useEffect(() => {
    if (!pending && state && !state.error) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="What needs to be done?"
          maxLength={280}
          autoComplete="off"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-black px-5 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
