import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Idempotent: ssr.ts also guards on isRegistered, so double-registration is safe.
//
// Same-origin policy is off because happy-dom replaces the global `fetch` with a
// browser-shaped one that sends a CORS preflight. The code under test never runs
// in a browser — the CLI uses Bun's native fetch — so enforcing CORS here would
// only test the harness. (raw.githubusercontent.com answers OPTIONS with 403.)
if (!GlobalRegistrator.isRegistered) {
  GlobalRegistrator.register({
    settings: { fetch: { disableSameOriginPolicy: true } },
  });
}
