import { signal } from "@preact/signals-core";

// Hero content signals
export const heroTitle = signal("Welcome to AdvanxJS");
export const heroSubtitle = signal("Build reactive, agent-native web applications with ease.");
export const ctaText = signal("Get Started");

// The CTA route is written directly into view.html: the runtime interpolates
// text nodes only, so an `ax-link="{{ … }}"` never resolves. Attribute
// bindings are M2.
