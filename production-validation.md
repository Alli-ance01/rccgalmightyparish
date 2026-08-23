# Production Validation Notes

## 2026-08-23

The Vercel production homepage at `https://rccgalmightyparish.vercel.app` was reachable and served the established public site. However, `/announcements` returned the application’s not-found screen immediately after GitHub `main` advanced to commit `1075082`. This confirms that the live Vercel build had not yet picked up the public announcement routes at the time of validation. Trigger or wait for a Vercel production deployment from the latest `main` commit, then recheck `/announcements` and the public homepage announcement strip.

The live route then displayed a blank loading state on one subsequent refresh, so the post-redeploy validation must include a browser-console/network check for the configured `VITE_API_BASE_URL` and a Render API response.

The Render health endpoint at `https://rccg-tap-api.onrender.com/` returned `{"service":"TAP Church API","status":"ok"}`. The public `content.announcements.list` procedure also returned the currently active announcement from MongoDB. This indicates the existing Render service is healthy and serving announcement data; the missing public archive is a Vercel frontend deployment gap rather than an API availability issue.
