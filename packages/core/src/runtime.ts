import { effect, signal, computed } from "@preact/signals-core";
export { signal, computed, effect };

export function mount(root: HTMLElement, logic: any) {
  // 0. LOOPS (ax-for) — detach templates before other passes see them
  processLoops(root, logic);

  // 1. MUSTACHE BINDINGS
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: { node: Text; original: string }[] = [];
  let tNode;
  while ((tNode = walker.nextNode())) {
    if (tNode.textContent?.includes("{{")) {
      textNodes.push({ node: tNode as Text, original: tNode.textContent });
    }
  }
  textNodes.forEach(({ node, original }) => {
    const key = original.match(/\{\{\s*(\w+)\s*\}\}/)?.[1];
    if (key && logic[key] && 'value' in logic[key]) {
      effect(() => { node.textContent = original.replace(/\{\{.*?\}\}/, logic[key].value); });
    }
  });

  // 2. CONDITIONALS (ax-if)
  Array.from(root.querySelectorAll('[ax-if]')).forEach(el => {
    const element = el as HTMLElement;
    const key = element.getAttribute('ax-if');
    const sig = logic[key!];
    if (sig && 'value' in sig) {
      const placeholder = document.createComment(` ax-if: ${key} `);
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
    }
  });

  // 3. EVENTS (ax-on:<event>="handler")
  wireEvents(root, logic);
}

function processLoops(root: HTMLElement, logic: any) {
  Array.from(root.querySelectorAll('[ax-for]')).forEach(el => {
    const element = el as HTMLElement;
    const expr = element.getAttribute('ax-for')!;
    const [alias, source] = expr.split(/\s+in\s+/).map(s => s.trim());
    const sig = logic[source];
    if (!sig || !('value' in sig)) return;

    element.removeAttribute('ax-for');
    const template = element.cloneNode(true) as HTMLElement;
    const placeholder = document.createComment(` ax-for: ${alias} in ${source} `);
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
  const aliasRe = new RegExp(`\\{\\{\\s*${alias}\\s*\\}\\}`, 'g');
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  let t: Node | null;
  while ((t = walker.nextNode())) {
    if (t.textContent?.includes('{{')) {
      t.textContent = t.textContent.replace(aliasRe, String(item));
    }
  }
  wireEvents(clone, logic);
  return clone;
}

function wireEvents(root: Element, logic: any) {
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
