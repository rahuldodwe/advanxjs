import { effect, signal, computed } from "@preact/signals-core";
export { signal, computed, effect };

export function mount(root: HTMLElement, logic: any) {
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

  // 3. EVENTS
  root.querySelectorAll('[onclick]').forEach(el => {
    const method = el.getAttribute('onclick')?.replace('()', '');
    if (method && typeof logic[method] === 'function') {
      el.removeAttribute('onclick');
      el.addEventListener('click', () => logic[method]());
    }
  });
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
