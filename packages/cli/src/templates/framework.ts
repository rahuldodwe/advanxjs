// Embedded framework source for the AdvanxJS scaffolder.
// These strings are verbatim copies of packages/core/src/runtime.ts and
// packages/core/src/directives.ts. If those files change, regenerate this file.
// Embedding is required so `advanx create` works after `bun link` (no
// monorepo-relative path traversal at runtime).

export const RUNTIME = `import { effect, signal, computed } from "@preact/signals-core";
import {
  processLoops,
  wireMustaches,
  wireConditionals,
  wireEvents,
  wireModels,
} from "./directives";

export { signal, computed, effect };

export function mount(root: HTMLElement, logic: any) {
  processLoops(root, logic);
  wireMustaches(root, logic);
  wireConditionals(root, logic);
  wireEvents(root, logic);
  wireModels(root, logic);
}

export function bootstrap(view: string, style: string, logic: any) {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
  const appDiv = document.getElementById("app");
  if (appDiv) {
    appDiv.innerHTML = view;
    mount(appDiv, logic);
  }
}
`;

export const DIRECTIVES = `import { effect } from "@preact/signals-core";

export function wireMustaches(root: Element, logic: any) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: { node: Text; original: string }[] = [];
  let tNode;
  while ((tNode = walker.nextNode())) {
    if (tNode.textContent?.includes("{{")) {
      textNodes.push({ node: tNode as Text, original: tNode.textContent });
    }
  }
  textNodes.forEach(({ node, original }) => {
    const allPaths = [...original.matchAll(/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g)].map(m => m[1]);
    const valid = allPaths.filter(p => {
      const rk = p.split(".")[0];
      return logic[rk] && 'value' in logic[rk];
    });
    if (valid.length === 0) return;
    effect(() => {
      node.textContent = original.replace(/\\{\\{\\s*([\\w.]+)\\s*\\}\\}/g, (_, p) => {
        const rk = p.split(".")[0];
        if (!logic[rk] || !('value' in logic[rk])) return \`{{ \${p} }}\`;
        return String(resolvePath(logic, p) ?? "");
      });
    });
  });
}

export function wireConditionals(root: Element, logic: any) {
  Array.from(root.querySelectorAll('[ax-if]')).forEach(el => {
    const element = el as HTMLElement;
    const key = element.getAttribute('ax-if');
    const sig = logic[key!];
    if (!sig || !('value' in sig)) return;
    const placeholder = document.createComment(\` ax-if: \${key} \`);
    let isMounted = true;
    effect(() => {
      const show = !!sig.value;
      if (show && !isMounted) {
        placeholder.parentNode?.replaceChild(element, placeholder);
        isMounted = true;
      } else if (!show && isMounted) {
        element.parentNode?.replaceChild(placeholder, element);
        isMounted = false;
      }
    });
  });
}

export function processLoops(root: Element, logic: any) {
  Array.from(root.querySelectorAll('[ax-for]')).forEach(el => {
    const element = el as HTMLElement;
    const expr = element.getAttribute('ax-for')!;
    const [alias, source] = expr.split(/\\s+in\\s+/).map(s => s.trim());
    const sig = logic[source];
    if (!sig || !('value' in sig)) return;

    element.removeAttribute('ax-for');
    const template = element.cloneNode(true) as HTMLElement;
    const placeholder = document.createComment(\` ax-for: \${alias} in \${source} \`);
    element.parentNode!.replaceChild(placeholder, element);

    const rendered: { node: Element; data: any }[] = [];
    effect(() => {
      const items = (sig.value ?? []) as any[];
      const parent = placeholder.parentNode!;
      items.forEach((item, i) => {
        if (i < rendered.length) {
          if (rendered[i].data !== item) {
            const fresh = hydrateClone(template, alias, item, logic);
            parent.replaceChild(fresh, rendered[i].node);
            rendered[i] = { node: fresh, data: item };
          }
        } else {
          const fresh = hydrateClone(template, alias, item, logic);
          parent.insertBefore(fresh, placeholder);
          rendered.push({ node: fresh, data: item });
        }
      });
      while (rendered.length > items.length) {
        parent.removeChild(rendered.pop()!.node);
      }
    });
  });
}

function hydrateClone(template: HTMLElement, alias: string, item: any, logic: any): Element {
  const clone = template.cloneNode(true) as HTMLElement;
  const aliasRe = new RegExp(\`\\\\{\\\\{\\\\s*\${alias}(\\\\.[\\\\w.]+)?\\\\s*\\\\}\\\\}\`, "g");
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  let t: Node | null;
  while ((t = walker.nextNode())) {
    if (!t.textContent?.includes("{{")) continue;
    t.textContent = t.textContent.replace(aliasRe, (_, sub) => {
      if (!sub) return String(item);
      let cur: any = item;
      for (const p of sub.slice(1).split(".")) {
        if (cur == null) return "";
        cur = cur[p];
      }
      return String(cur ?? "");
    });
  }
  wireEvents(clone, logic);
  return clone;
}

export function wireEvents(root: Element, logic: any) {
  const targets: Element[] = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const el of targets) {
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('ax-on:')) continue;
      const event = attr.name.slice(6);
      const method = attr.value;
      if (typeof logic[method] === 'function') {
        el.removeAttribute(attr.name);
        el.addEventListener(event, () => logic[method]());
      }
    }
  }
}

export function wireModels(root: Element, logic: any) {
  root.querySelectorAll('[ax-model]').forEach(el => {
    const name = el.getAttribute('ax-model')!;
    const sig = logic[name];
    if (!sig || !('value' in sig)) return;
    el.removeAttribute('ax-model');
    const input = el as HTMLInputElement;
    effect(() => {
      const v = String(sig.value ?? "");
      if (input.value !== v) input.value = v;
    });
    const sync = () => { sig.value = input.value; };
    ['input', 'change'].forEach(e => input.addEventListener(e, sync));
    if (input.value) sync();
  });
}

function resolvePath(logic: any, path: string): any {
  const parts = path.split(".");
  const sig = logic[parts[0]];
  if (!sig || !('value' in sig)) return undefined;
  let cur = sig.value;
  for (let i = 1; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}
`;
