export const COUNTER_LOGIC = `import { signal } from "../../lib/advanx/runtime.ts";

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
  <title>AdvanxJS — Welcome</title>
  <style>
    :root {
      --advanx-coral: #FF4D2E;
      --advanx-ink: #0e0e10;
      --advanx-cream: #f4f1eb;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, #ffffff 0%, var(--advanx-cream) 70%);
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      color: var(--advanx-ink);
    }
    .welcome {
      max-width: 720px;
      margin: 0 auto;
      padding: 3rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .welcome h1 {
      font-size: 2.4rem;
      font-weight: 700;
      margin: 0.5rem 0 0.4rem;
      letter-spacing: -0.02em;
    }
    .welcome .tagline {
      font-size: 1.05rem;
      color: #4a4a4f;
      margin: 0 0 2rem;
    }
    .welcome #app {
      background: #ffffff;
      padding: 1.75rem 2rem;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(14, 14, 16, 0.08);
      min-width: 240px;
    }
    .welcome #app p { margin: 0 0 0.75rem; font-size: 1.1rem; color: var(--advanx-ink); }
    .welcome #app button {
      background: var(--advanx-coral);
      color: #fff;
      border: none;
      padding: 0.55rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    .welcome #app button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(255, 77, 46, 0.3);
    }
    .next-steps {
      list-style: none;
      padding: 0;
      margin: 2.5rem 0 0;
      text-align: left;
      max-width: 480px;
      width: 100%;
    }
    .next-steps li {
      padding: 0.6rem 0;
      border-top: 1px solid rgba(14, 14, 16, 0.08);
      font-size: 0.95rem;
      color: #4a4a4f;
    }
    .next-steps li:last-child { border-bottom: 1px solid rgba(14, 14, 16, 0.08); }
    .next-steps code {
      background: rgba(255, 77, 46, 0.08);
      color: var(--advanx-coral);
      padding: 0.1rem 0.4rem;
      border-radius: 0.3rem;
      font-size: 0.88em;
      font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    /* ==========================================================
       <advanx-logo> — drop-in animated logo component
       Transparent background. Coral A with 3 orbiting electrons.
       ========================================================== */
    .advanx-logo {
      position: relative;
      display: inline-block;
      width: 240px;
      height: 240px;
      background: transparent;
    }
    .advanx-logo .advanx-a {
      position: absolute;
      inset: 22%;
      width: 56%;
      height: 56%;
      animation: advanx-breathe 4s ease-in-out infinite;
      transform-origin: 50% 50%;
    }
    .advanx-logo .advanx-a path {
      fill: #FF4D2E;
    }
    .advanx-logo .advanx-orbit {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .advanx-logo .advanx-orbit svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      animation: advanx-spin 9s linear infinite;
    }
    .advanx-logo .advanx-orbit:nth-of-type(2) svg {
      animation-duration: 11s;
      animation-direction: reverse;
    }
    .advanx-logo .advanx-orbit:nth-of-type(3) svg {
      animation-duration: 14s;
    }
    .advanx-logo .advanx-orbit ellipse {
      fill: none;
      stroke: rgba(255, 77, 46, 0.32);
      stroke-width: 1.2;
    }
    .advanx-logo .advanx-orbit .advanx-dot {
      fill: #FF4D2E;
    }

    @keyframes advanx-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes advanx-breathe {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.05); }
    }
  </style>
</head>
<body>
  <main class="welcome">
    <div class="advanx-logo" role="img" aria-label="AdvanxJS">
      <svg class="advanx-a" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M 96 26 L 24 174 L 50 174 L 78 116 Z" />
        <path d="M 104 26 L 176 174 L 150 174 L 122 116 Z" />
        <path d="M 82 124 L 118 124 L 130 150 L 70 150 Z" />
      </svg>
      <div class="advanx-orbit">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="100" rx="92" ry="36" />
          <circle class="advanx-dot" cx="192" cy="100" r="5" />
        </svg>
      </div>
      <div class="advanx-orbit">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="100" rx="92" ry="36" transform="rotate(60 100 100)" />
          <circle class="advanx-dot" cx="100" cy="100" r="4" transform="rotate(60 100 100) translate(92 0)" />
        </svg>
      </div>
      <div class="advanx-orbit">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="100" rx="92" ry="36" transform="rotate(-60 100 100)" />
          <circle class="advanx-dot" cx="100" cy="100" r="4" transform="rotate(-60 100 100) translate(92 0)" />
        </svg>
      </div>
    </div>

    <h1>Welcome to AdvanxJS</h1>
    <p class="tagline">The Agent-Native frontend framework.</p>

    <div id="app"></div>

    <ul class="next-steps">
      <li>Edit <code>src/components/counter/view.html</code> to change the UI.</li>
      <li>Run <code>advanx explain src/components/counter</code> to inspect the contract.</li>
      <li>Read <code>CONSTITUTION.md</code> for the eight laws every component follows.</li>
    </ul>
  </main>

  <script src="./src/components/counter/dist/bundle.js"></script>
</body>
</html>
`;
