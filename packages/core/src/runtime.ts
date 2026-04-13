// ARTICLE II: THE SIGNAL IS TRUTH
// We export signals from here so the entire app uses ONE instance.
export { signal, computed, effect } from "@preact/signals-core";
import { effect } from "@preact/signals-core";

export function mount(root: HTMLElement, logic: any) {
  console.log("AdvanxJS: Mounting with logic keys:", Object.keys(logic));

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: { node: Text; original: string }[] = [];
  let tNode;
  while ((tNode = walker.nextNode())) {
    if (tNode.textContent?.includes("{{")) {
      textNodes.push({ node: tNode as Text, original: tNode.textContent });
    }
  }

  textNodes.forEach(({ node, original }) => {
    const match = original.match(/\{\{\s*(\w+)\s*\}\}/);
    if (match) {
      const key = match[1];
      const sig = logic[key];

      if (sig && typeof sig === 'object' && 'value' in sig) {
        effect(() => {
          const val = sig.value;
          console.log(`AdvanxJS: DOM Update -> ${key} = ${val}`);
          node.textContent = original.replace(match[0], val);
        });
      }
    }
  });

  root.querySelectorAll('[onclick]').forEach(el => {
    const method = el.getAttribute('onclick')?.replace('()', '');
    if (method && logic[method]) {
      el.removeAttribute('onclick');
      el.addEventListener('click', () => {
        console.log(`AdvanxJS: Action Triggered -> ${method}`);
        logic[method]();
      });
    }
  });
}
