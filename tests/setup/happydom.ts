import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Idempotent: ssr.ts also guards on isRegistered, so double-registration is safe.
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();
