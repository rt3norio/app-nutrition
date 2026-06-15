// The app's own Google OAuth Web client id, baked in at build time so end users
// never touch Google Cloud. A SPA client id is public (only the authorized
// origin gates it), so committing/exposing it is safe by design.
//
// Set via the `VITE_GOOGLE_CLIENT_ID` build env (injected by the deploy workflow
// from a GitHub Actions variable). Empty when not configured.
export const BUILTIN_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? '';
