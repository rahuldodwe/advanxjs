// Value resolution shared by the mustache, event, and loop paths: turns a view
// token (a literal, or a dot-path into a signal or a loop alias) into a value.

export function resolveArg(expr: string, logic: any, scope?: any): any {
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

export function splitArgs(s: string): string[] {
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
