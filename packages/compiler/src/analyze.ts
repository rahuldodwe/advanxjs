import ts from "typescript";

export interface LogicAnalysis {
  signals: string[];
  computed: string[];
  actions: string[];
}

export function analyzeLogic(code: string, filename = "logic.ts"): LogicAnalysis {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.ESNext, true);
  const out: LogicAnalysis = { signals: [], computed: [], actions: [] };

  source.forEachChild(node => {
    if (!hasExport(node)) return;

    if (ts.isFunctionDeclaration(node) && node.name) {
      out.actions.push(node.name.text);
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
        const name = decl.name.text;
        const init = decl.initializer;

        if (ts.isCallExpression(init) && ts.isIdentifier(init.expression)) {
          const callee = init.expression.text;
          if (callee === "signal") out.signals.push(name);
          else if (callee === "computed") out.computed.push(name);
        } else if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
          out.actions.push(name);
        }
      }
    }
  });

  return out;
}

function hasExport(node: ts.Node): boolean {
  return !!(ts.canHaveModifiers(node) &&
    ts.getModifiers(node)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
}
