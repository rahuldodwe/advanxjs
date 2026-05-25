import { signal } from "@preact/signals-core";

export const faqs = signal([
  { q: "What is AdvanxJS?", a: "An agent-native framework that splits every component into logic, view, and style." },
  { q: "How small is the runtime?", a: "The core stays under 5KB gzipped — static-by-default ships zero JS when nothing is reactive." },
  { q: "Do I need a build step?", a: "The compiler validates the logic/view contract and bundles with Bun." },
  { q: "Is it production ready?", a: "The Starter Kit is stable; advanced directive nesting lands in Phase 2.4." },
]);
