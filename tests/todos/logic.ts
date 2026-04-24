import { signal } from "../../packages/core/src/runtime.ts";

export const todos = signal(["Buy groceries", "Write code", "Ship AdvanxJS"]);

export function addTodo() {
  todos.value = [...todos.value, "Task " + (todos.value.length + 1)];
}

export function removeLast() {
  todos.value = todos.value.slice(0, -1);
}
