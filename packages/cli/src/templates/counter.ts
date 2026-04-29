export const COUNTER_LOGIC = `import { signal } from "../../packages/core/src/runtime.ts";

export const count = signal(0);

export function increment() {
  count.value++;
}
`;

export const COUNTER_VIEW = `<p>Count: {{ count }}</p>
<button ax-on:click="increment">Add</button>
`;

export const COUNTER_STYLE = `p { color: blue; }
`;

export const COUNTER_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdvanxJS — Counter</title>
  <style>
    body { background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    #app { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="./bundle.js"></script>
</body>
</html>
`;
