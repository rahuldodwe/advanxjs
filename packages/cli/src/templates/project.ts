export function packageJson(name: string): string {
  const pkg = {
    name,
    module: "index.ts",
    type: "module",
    private: true,
    devDependencies: {
      "@types/bun": "latest",
      typescript: "^6.0.3",
    },
    dependencies: {
      "@preact/signals-core": "^1.13.0",
    },
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}

export const TSCONFIG = `{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
`;

export const GITIGNORE = `node_modules
dist
*.tgz
.DS_Store
.env
.env.*.local
.cache
*.tsbuildinfo
.idea
.advanx-meta.json
`;

export function readme(name: string): string {
  return `# ${name}

An AdvanxJS project — built on the Agent-Native (AX) framework.

## Quick Start

\`\`\`bash
bun install
advanx build tests/counter
open tests/counter/dist/index.html
\`\`\`

## Add a component

1. Create \`tests/<name>/{logic.ts,view.html,style.css}\`.
2. Run \`advanx build tests/<name>\`.
3. Inspect the contract: \`advanx explain tests/<name>\`.

See \`CONSTITUTION.md\` for the eight laws every component must follow.
`;
}
