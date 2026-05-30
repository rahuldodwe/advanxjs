import { signal } from "../../packages/core/src/runtime.ts";

export const todos = signal([
  { id: 1, text: "Buy groceries" },
  { id: 2, text: "Write code" },
  { id: 3, text: "Ship AdvanxJS" },
]);

let nextId = 4;

export function addTodo() {
  todos.value = [...todos.value, { id: nextId++, text: "Task " + (todos.value.length + 1) }];
}

export function removeTask(id: number) {
  todos.value = todos.value.filter(t => t.id !== id);
}

export function setLabel(id: number, label: string) {
  todos.value = todos.value.map(t => t.id === id ? { ...t, text: label } : t);
}
