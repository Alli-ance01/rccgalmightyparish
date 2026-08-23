# Production Validation Notes

## 2026-08-23

The Vercel production homepage at `https://rccgalmightyparish.vercel.app` was reachable and served the established public site. However, `/announcements` returned the application’s not-found screen immediately after GitHub `main` advanced to commit `1075082`. This confirms that the live Vercel build had not yet picked up the public announcement routes at the time of validation. Trigger or wait for a Vercel production deployment from the latest `main` commit, then recheck `/announcements` and the public homepage announcement strip.

The live route then displayed a blank loading state on one subsequent refresh, so the post-redeploy validation must include a browser-console/network check for the configured `VITE_API_BASE_URL` and a Render API response.

The Render health endpoint at `https://rccg-tap-api.onrender.com/` returned `{"service":"TAP Church API","status":"ok"}`. The public `content.announcements.list` procedure also returned the currently active announcement from MongoDB. This indicates the existing Render service is healthy and serving announcement data; the missing public archive is a Vercel frontend deployment gap rather than an API availability issue.

After the subsequent GitHub push, Vercel began serving the `/announcements` route. Its rendered page remained on the `Loading announcements…` state rather than displaying the active announcement, despite the Render public procedure returning data when opened directly. The browser console contained no client-side error, so the next check is an in-page cross-origin request to confirm the deployed frontend’s API base URL and CORS behavior.

The in-page cross-origin fetch to the Render announcement procedure returned HTTP 200 with JSON data. On the subsequent page check, the `/announcements` archive displayed the active announcement and the site-wide header strip. This confirms that the deployed Vercel application and configured Render API origin work together; the earlier loading display resolved after the asynchronous query completed.

The production homepage was also rechecked and rendered the site-wide `Announcement` strip plus the **From the church office** section containing the active announcement. Both required public announcement surfaces are therefore live against the current Vercel deployment and Render data source.

Keyboard navigation was checked on the production homepage. The first two `Tab` presses moved visibly between the announcement title and announcement call-to-action, showing clear focus treatment and a logical sequence for the new global announcement controls.

The local API was restarted after replacing the active SDK with a local-session-only implementation. The fresh startup log reached `Server running` without the former OAuth initialization output. The remaining local MongoDB notices are expected because sandbox development does not include the user’s Render `MONGODB_URI` secret.

## Staff session validation follow-up

After the cross-origin session repair was pushed, the user reported reaching the live Admin page. A browser reload check from the automation session initially displayed the dashboard skeleton and then returned to the public `Sign in to continue` gate. The next diagnostic step is to inspect the Vercel tab’s per-tab session-storage token and the authenticated `auth.me` response without exposing its value.

The live Vercel JavaScript bundle was confirmed to contain the `tap-local-session-token` fallback. In the automation tab, no session token is currently stored and `auth.me` returns `null`, so that tab has not retained a fresh post-deployment login. This does not expose any credential value; a sign-in within the same browser tab is required to complete the live validation.

The public production `/sign-in` route was opened directly in the automation browser after the black-screen report. It rendered the full TAP sign-in form, navigation, and footer rather than a blank screen. The black-screen symptom may therefore be limited to the user takeover surface or a specific post-login navigation state; the next check is the live browser console and authenticated navigation state after a same-tab sign-in.

The user subsequently confirmed that staff sign-in and Administration work in their normal browser. The blank black takeover surface is therefore not a live TAP production rendering failure. Production staff authentication is considered validated through the normal browser session; the automation takeover surface remains unsuitable for authenticated session testing.

The user then confirmed from the normal Master Admin browser session that the Administration workflow works and **Cloudinary Verify connection** was accepted. This validates the Render-side Cloudinary credentials without exposing them. The user also confirmed the requested access-management view was working after opening it from the Admin session.
