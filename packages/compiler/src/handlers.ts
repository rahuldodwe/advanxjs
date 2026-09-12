// Shared matchers and the `ax-on` handler grammar. Split out of validate.ts to
// keep both files inside the Article IV budget.

export const IDENT = /^[A-Za-z_$][\w$]*$/;
export const PATH = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/;
export const LITERAL = /^("[^"]*"|'[^']*'|-?\d+(\.\d+)?|true|false|null)$/;
const CALL = /^([A-Za-z_$][\w$]*)(?:\((.*)\))?$/;

export type ParsedHandler = { name: string; args: string[] };
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

export function parseHandler(handler: string): ParsedHandler | null {
  const m = handler.match(CALL);
  if (!m) return null;
  if (m[2] === undefined) return { name: m[1]!, args: [] };
  const args = splitArgs(m[2]).map(a => a.trim());
  for (const a of args) {
    if (!LITERAL.test(a) && !PATH.test(a)) return null;
  }
  return { name: m[1]!, args };
}

