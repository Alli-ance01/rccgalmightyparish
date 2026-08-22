# TAP Church: Render + Vercel Deployment Walkthrough

## Read this first

The repository has two deployable parts:

| Part | Host | What it serves |
| --- | --- | --- |
| React/Vite frontend | Vercel | Public TAP pages, navigation, contact information, giving page, and user interface. |
| Express/tRPC API | Render | Public content queries, staff content operations, database access, and future API integrations. |

The current code can be deployed as a frontend plus API. However, two template-provided services are **not portable to a standalone Render/Vercel deployment** without further integration work:

1. **Staff login** currently relies on the scaffold’s OAuth environment values.
2. **Media upload** currently relies on Manus Forge credentials for S3 presigned URLs.

Do not copy development secrets or Manus-issued secrets into Render, Vercel, or GitHub. The public website and API can still be deployed while admin login and media upload are intentionally held back until an external authentication provider and S3-compatible storage are configured.

## Part A — Prepare a production database

The API uses **MongoDB** through the official MongoDB Node.js driver. Before deploying the API, provision a MongoDB Atlas cluster (or another MongoDB-compatible service) and obtain its connection string.

Set the database’s connection string as `MONGODB_URI` in Render. Keep the value private.

> The app creates its required MongoDB collection indexes at startup. There are no SQL migrations to apply.

Use the MongoDB Atlas dashboard to create the database user, allow Render connectivity, and copy the driver connection string. Do not add the connection string to GitHub.

## Part B — Create the Render API service

1. In [Render](https://dashboard.render.com/), select **New +** and choose **Web Service**.
2. Connect GitHub and select the repository **`Alli-ance01/rccgalmightyparish`**.
3. Use these service settings:

| Render field | Value |
| --- | --- |
| Name | `rccg-tap-api` (or a name you prefer) |
| Branch | `main` |
| Root directory | Leave blank |
| Runtime | Node |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `node dist/index.js` |
| Health check path | `/` |
| Region | Choose the closest suitable region for your audience and database |

4. Add these environment variables under **Environment**:

| Variable | Value now |
| --- | --- |
| `NODE_ENV` | `production` |
| `API_ONLY` | `true` |
| `MONGODB_URI` | Your production MongoDB Atlas connection string |
| `JWT_SECRET` | A new, long random secret; never reuse or publish it |
| `CORS_ORIGIN` | Temporary Vercel placeholder for now; replace after Vercel gives you the frontend URL |
| `WEB_APP_URL` | Temporary Vercel placeholder for now; replace after Vercel gives you the frontend URL |

Do **not** add `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, or `BUILT_IN_FORGE_API_KEY` unless you have replaced the current template-specific integrations with credentials from services you independently control.

5. Click **Create Web Service** and wait for the deployment to finish.
6. Copy the public Render URL, for example:

```text
https://rccg-tap-api.onrender.com
```

Open that URL. A healthy API-only service should return a small JSON response rather than the React website.

## Part C — Deploy the frontend on Vercel

1. In [Vercel](https://vercel.com/new), select **Add New → Project**.
2. Import **`Alli-ance01/rccgalmightyparish`**.
3. Confirm these build settings. The committed `vercel.json` already supplies them, but verify they appear correctly.

| Vercel field | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | `.` |
| Build command | `pnpm vite build` |
| Output directory | `dist/public` |

4. Add this Vercel environment variable for **Production**, **Preview**, and **Development**:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Your full Render API origin, for example `https://rccg-tap-api.onrender.com` |

5. Click **Deploy**. Copy the Vercel production URL, for example:

```text
https://rccg-tap-church.vercel.app
```

## Part D — Connect the two deployments

Return to the Render service and replace the temporary values:

| Render variable | Exact value |
| --- | --- |
| `CORS_ORIGIN` | The Vercel production URL, with no trailing slash |
| `WEB_APP_URL` | The same Vercel production URL, with no trailing slash |

Save the variables and manually redeploy Render. Then redeploy Vercel once more if you changed `VITE_API_BASE_URL`.

## Part E — Verify the public production site

1. Open the Vercel URL.
2. Confirm `/`, `/visit`, `/contact`, `/give`, `/ministries`, `/sermons`, `/events`, and `/junior-church` load.
3. Click from a scrolled page to another page; the destination should start at the top.
4. Open browser developer tools and confirm there are no CORS errors on public content requests.
5. Confirm the contact page shows the official address, phone number, and email; confirm the Give page shows the OPay details.

## Part F — Do not enable these production functions yet

| Feature | Why it is not ready for external hosting | Required follow-up |
| --- | --- | --- |
| Staff sign-in and `/admin` publishing | Current OAuth settings were provided by the development scaffold. | Integrate an external provider you control, such as Auth0, Clerk, Supabase Auth, or a custom authentication solution. |
| Media upload | Current upload helper requests S3 presigned URLs from Manus Forge. | Replace it with AWS S3, Cloudflare R2, Supabase Storage, or another independently managed S3-compatible provider. |

Once the final church domain is chosen, prefer related custom subdomains:

| Purpose | Suggested domain |
| --- | --- |
| Public Vercel website | `www.yourchurchdomain.com` |
| Render API | `api.yourchurchdomain.com` |

Tell the implementation team both deployed URLs after Parts B and C. They are required to complete the external authentication and media-storage integration safely.
