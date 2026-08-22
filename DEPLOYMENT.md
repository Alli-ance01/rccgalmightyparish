# Deploy TAP Church: MongoDB Atlas → Render → Vercel

This is the only deployment guide you need for the **first public launch** of TAP Church.

> **Launch scope:** This guide deploys the public website and its MongoDB-backed API. The current staff login and media-upload systems depend on development-only integrations, so **do not configure or use `/admin` in production yet**. Public pages, contact details, giving information, ministries, sermons, events, media listings, and news can launch now.

## Before you begin

You need three accounts:

| Service | Why you need it |
| --- | --- |
| GitHub | The code is already in [`Alli-ance01/rccgalmightyparish`](https://github.com/Alli-ance01/rccgalmightyparish). |
| MongoDB Atlas | Stores public and future church content. |
| Render + Vercel | Render runs the API; Vercel serves the public website. |

Keep passwords, connection strings, and secrets private. Do not place them in GitHub, source files, or public messages.

---

## Step 1 — Create the MongoDB Atlas database

1. Sign in at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new project, for example **TAP Church**.
3. Create a free shared cluster. Any sensible nearby region is fine for the first launch.
4. Open **Database Access** and create a database user with a long, unique password. Save the username and password privately.
5. Open **Network Access** and add an access rule that allows the Render service to connect. For a first deployment, Atlas may require `0.0.0.0/0`; if you use it, protect the database with a strong unique password and do not reuse that password anywhere else.
6. Select **Connect → Drivers**, choose **Node.js**, and copy the connection string. Replace the username and password placeholders, then give the database a name such as `tap_church`.

It should resemble this:

```text
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/tap_church?retryWrites=true&w=majority
```

> If the database password contains characters such as `@`, `:`, `/`, or `#`, URL-encode the password before placing it in the connection string.

---

## Step 2 — Deploy the API on Render

1. Sign in at [Render](https://dashboard.render.com/).
2. Select **New + → Web Service**.
3. Connect GitHub and choose **`Alli-ance01/rccgalmightyparish`**.
4. Enter the following values:

| Render field | Value |
| --- | --- |
| Name | `rccg-tap-api` |
| Branch | `main` |
| Root directory | Leave empty |
| Runtime | Node |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `node dist/index.js` |
| Health check path | `/` |

5. Add **only these variables** under Render’s **Environment** section:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `API_ONLY` | `true` |
| `MONGODB_URI` | The full MongoDB Atlas connection string from Step 1 |
| `JWT_SECRET` | A long random value. Generate one with a password manager and keep it private. |

6. Click **Create Web Service** and wait for the deployment to finish.
7. Copy your API URL. It will look similar to:

```text
https://rccg-tap-api.onrender.com
```

8. Open that URL in a browser. A healthy API responds with JSON rather than the TAP website.

> **Do not add these variables:** `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, or `BUILT_IN_FORGE_API_KEY`. They are not required for the first public launch and are tied to development-only integrations.

---

## Step 3 — Deploy the public website on Vercel

1. Sign in at [Vercel](https://vercel.com/new).
2. Select **Add New → Project**.
3. Import **`Alli-ance01/rccgalmightyparish`**.
4. Confirm the build configuration below. The repository’s `vercel.json` already provides these values.

| Vercel field | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | `.` |
| Build command | `pnpm vite build` |
| Output directory | `dist/public` |

5. In **Environment Variables**, add this one variable for the **Production** environment:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Your full Render API URL from Step 2, for example `https://rccg-tap-api.onrender.com` |

6. Click **Deploy**.
7. Copy the Vercel production URL. It will resemble:

```text
https://rccg-tap-church.vercel.app
```

---

## Step 4 — Connect Render to Vercel

Return to your **Render** service, open **Environment**, and add these two variables:

| Variable | Exact value |
| --- | --- |
| `CORS_ORIGIN` | Your Vercel production URL, with no trailing slash |
| `WEB_APP_URL` | The same Vercel production URL, with no trailing slash |

Save the values and click **Manual Deploy → Deploy latest commit** in Render.

Example:

```text
CORS_ORIGIN=https://rccg-tap-church.vercel.app
WEB_APP_URL=https://rccg-tap-church.vercel.app
```

---

## Step 5 — Check the public website

Open your Vercel URL and check the following:

1. The homepage loads.
2. `/visit`, `/contact`, `/give`, `/ministries`, `/sermons`, `/events`, `/media`, and `/junior-church` open successfully.
3. The contact page shows the published phone number, email address, and church address.
4. The giving page shows the OPay account details.
5. Clicking from a page you have scrolled down opens the next page at the top.
6. Browser developer tools show no CORS errors.

If a public page cannot load data, confirm that `VITE_API_BASE_URL` is the complete Render URL and that `CORS_ORIGIN` exactly matches the Vercel URL.

---

## Step 6 — Add a custom domain later

When you choose the church domain, add it in **Vercel → Project → Settings → Domains**. Then update both Render values in Step 4 to the final website origin.

Example:

```text
CORS_ORIGIN=https://www.tapchurch.org
WEB_APP_URL=https://www.tapchurch.org
```

Redeploy Render after making the change.

---

## Not part of the first launch

These features need a later production integration before they can be enabled safely:

| Feature | Later work required |
| --- | --- |
| Staff/admin login | Replace the development sign-in system with authentication you control, such as Firebase Auth, Clerk, Auth0, or a custom email/password system. |
| Uploading photos, videos, and documents | Replace the development storage helper with your own AWS S3, Cloudflare R2, Supabase Storage, or another S3-compatible storage service. |
| Editor access and publishing | Enable only after staff authentication is configured and tested. |

For the first launch, keep the site focused on the public visitor experience.
