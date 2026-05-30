import { effect } from "@preact/signals-core";

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

const AX_ON_RE = /^(\w+)(?:\((.*)\))?$/;

export function wireEvents(root: Element, logic: any, scope?: any) {
  const targets: Element[] = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const el of targets) {
    for (const attr of Array.from(el.attributes)) {
      if (!attr.name.startsWith('ax-on:')) continue;
      const m = attr.value.match(AX_ON_RE);
      if (!m) continue;
      const fn = logic[m[1]!];
      if (typeof fn !== 'function') continue;
      const event = attr.name.slice(6);
      el.removeAttribute(attr.name);
      if (m[2] === undefined) {
        el.addEventListener(event, () => fn());
      } else {
        const exprs = splitArgs(m[2]);
        el.addEventListener(event, () =>
          fn(...exprs.map(a => resolveArg(a, logic, scope)))
        );
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

function resolveArg(expr: string, logic: any, scope?: any): any {
  const s = expr.trim();
  if (!s) return undefined;
  const c = s.charCodeAt(0);
  if (c === 34 || c === 39) return s.slice(1, -1);
  if ((c >= 48 && c <= 57) || (c === 45 && s.length > 1)) return Number(s);
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null") return null;
  const parts = s.split(".");
  const head = parts[0]!;
  let cur: any;
  if (scope && head in scope) {
    cur = scope[head];
  } else {
    const sig = logic[head];
    if (!sig || !("value" in sig)) return undefined;
    cur = sig.value;
  }
  for (let i = 1; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]!];
  }
  return cur;
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let buf = "", q = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if (q) { if (ch === q) q = 0; buf += s[i]; }
    else if (ch === 34 || ch === 39) { q = ch; buf += s[i]; }
    else if (ch === 44) { out.push(buf); buf = ""; }
    else buf += s[i];
  }
  if (buf.trim()) out.push(buf);
  return out;
}
