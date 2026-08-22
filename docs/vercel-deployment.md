# TAP Church Deployment Runbook

## Recommended architecture

This repository is configured for a **split deployment**. Deploy the React/Vite frontend on **Vercel** and the Express/tRPC API on a Node-compatible host such as **Render**. The API host is required for authenticated staff access, database content, S3 media uploads, and the tRPC endpoints.

> Deploying only the static frontend to Vercel will render the public interface, but dynamic content and the staff workspace require a working API deployment.

## 1. Deploy the API first

In Render, create a new **Web Service** from `Alli-ance01/rccgalmightyparish`. You may use `render.yaml` as the blueprint configuration or set the equivalent values manually.

| Render setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `node dist/index.js` |
| Health check | `/` |
| `API_ONLY` | `true` |
| `NODE_ENV` | `production` |

Before the first Render deployment, set the following server-side variables there. Do not commit them to the repository.

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Production MongoDB Atlas connection string used by the MongoDB Node.js driver. |
| `JWT_SECRET` | Long random production session-signing secret. |
| `CORS_ORIGIN` | Vercel frontend URL, for example `https://tap-church.vercel.app`. |
| `WEB_APP_URL` | Same Vercel frontend URL; used after sign-in. |
| `OAUTH_SERVER_URL` | OAuth provider base URL. |
| `VITE_APP_ID` | OAuth application/client identifier. |
| `OWNER_OPEN_ID` | Initial platform owner identity. |

The current staff login implementation uses the scaffold’s OAuth configuration. Those OAuth values are not transferable from the development environment automatically. Before relying on the staff login in an external deployment, create/use credentials for an OAuth provider you control or refactor the authentication layer to a provider such as Clerk, Auth0, or an application-owned JWT flow.

Once Render provides an API URL, keep it. For example: `https://rccg-tap-api.onrender.com`.

## 2. Deploy the frontend on Vercel

1. Open the Vercel dashboard and choose **Add New → Project**.
2. Import `Alli-ance01/rccgalmightyparish` from GitHub.
3. Use the **Vite** framework preset. The committed `vercel.json` already sets the build command, output directory, and SPA rewrite.
4. In **Environment Variables**, add `VITE_API_BASE_URL` with the full Render API URL, for example `https://rccg-tap-api.onrender.com`.
5. Deploy. Vercel will build with `pnpm vite build` and publish `dist/public`.

After Vercel gives you a production URL, return to Render and set both `CORS_ORIGIN` and `WEB_APP_URL` to that exact origin, without a trailing slash. Redeploy the Render service after changing environment variables.

## 3. Configure OAuth and domains

For the current login route, register this callback URL with the OAuth provider:

```text
https://YOUR_RENDER_API_DOMAIN/api/oauth/callback
```

For a more reliable cookie and login experience, use related production subdomains once the church domain is chosen:

| Service | Suggested domain |
| --- | --- |
| Vercel frontend | `www.yourchurchdomain.com` |
| Render API | `api.yourchurchdomain.com` |

Update `VITE_API_BASE_URL`, `CORS_ORIGIN`, `WEB_APP_URL`, and the OAuth callback URL whenever the final domain changes.

## 4. Production checks

After both deployments are live, confirm the following.

1. Public routes such as `/`, `/visit`, `/give`, `/sermons`, `/events`, and `/junior-church` load on Vercel.
2. Clicking an internal navigation link opens the destination at the top of the page.
3. The browser has no CORS error when loading content from the API.
4. The API root responds successfully and the staff workspace can sign in once production OAuth is configured.
5. An authorised editor can add a test draft, and an approved media upload reaches S3.

## Important current constraint

The public frontend can deploy to Vercel now. The production staff/admin workflow requires both the separate API deployment and OAuth credentials that you control. Do not add development-only or Manus-issued secrets to Vercel or GitHub.
