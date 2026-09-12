import { resolveArg, splitArgs } from "./resolve";

const AX_ON_RE = /^(\w+)(?:\((.*)\))?$/;

// The native DOM event is always passed as the LAST argument, after any args
// declared in the view. Handlers that take no parameters simply ignore it, so
// every existing `ax-on:click="toggle"` is unaffected. It remains the channel a
// handler has to the element it is bound to (`e.currentTarget`), though state
// bound for CSS now belongs in a signal behind `:style` / `:class`.

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
        el.addEventListener(event, ev => fn(ev));
      } else {
        const exprs = splitArgs(m[2]);
        el.addEventListener(event, ev =>
          fn(...exprs.map(a => resolveArg(a, logic, scope)), ev)
        );
      }
    }
  }
}
