import { effect } from "@preact/signals-core";
import { wireEvents } from "./events";
import { resolveArg } from "./resolve";

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
    const allPaths = [...original.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(m => m[1]);
    const valid = allPaths.filter(p => {
      const rk = p.split(".")[0];
      return logic[rk] && 'value' in logic[rk];
    });
    if (valid.length === 0) return;
    effect(() => {
      node.textContent = original.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
        const rk = p.split(".")[0];
        if (!logic[rk] || !('value' in logic[rk])) return `{{ ${p} }}`;
        return String(resolveArg(p, logic) ?? "");
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

    // Claim the paired `ax-else` before anything is detached — once a branch is
    // swapped for its placeholder it is no longer anyone's sibling.
    const next = element.nextElementSibling as HTMLElement | null;
    const elseEl = next?.hasAttribute('ax-else') ? next : null;
    elseEl?.removeAttribute('ax-else');

    const ifSlot = document.createComment(' ax-if ');
    const elseSlot = elseEl ? document.createComment(' ax-else ') : null;
    let ifOn = true;
    let elseOn = !!elseEl;

    const swap = (node: HTMLElement, slot: Comment, want: boolean, on: boolean) => {
      if (want && !on) slot.parentNode?.replaceChild(node, slot);
      else if (!want && on) node.parentNode?.replaceChild(slot, node);
      return want;
    };

    effect(() => {
      const show = !!sig.value;
      ifOn = swap(element, ifSlot, show, ifOn);
      if (elseEl && elseSlot) elseOn = swap(elseEl, elseSlot, !show, elseOn);
    });
  });
}

export function processLoops(root: Element, logic: any) {
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
  const aliasRe = new RegExp(`\\{\\{\\s*${alias}(\\.[\\w.]+)?\\s*\\}\\}`, "g");
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
  wireEvents(clone, logic, { [alias]: item });
  return clone;
}

export { wireEvents };

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
