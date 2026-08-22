# Deploy TAP Church: MongoDB Atlas → Render → Vercel

This checklist deploys the public TAP Church website, MongoDB data layer, custom member and staff accounts, Master Admin approval workflow, and Cloudinary media delivery.

> **Important:** All secrets belong in **Render**. The Vercel frontend needs only `VITE_API_BASE_URL`. Never put passwords, MongoDB connection strings, Cloudinary API secrets, or setup tokens in Vercel or GitHub.

## 1. Create MongoDB Atlas

Create a MongoDB Atlas project and cluster, then create a database user with a strong unique password. In **Network Access**, allow the Render API to connect; for an initial deployment, Atlas may require `0.0.0.0/0`. Copy the Node.js connection string, replace its username/password placeholders, and set a database name such as `tap_church`.

```text
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/tap_church?retryWrites=true&w=majority
```

If the database password contains characters such as `@`, `:`, `/`, or `#`, URL-encode it in the connection string.

## 2. Deploy the API on Render

Create a **Web Service** from `Alli-ance01/rccgalmightyparish` with the following values.

| Render field | Value |
| --- | --- |
| Name | `rccg-tap-api` |
| Branch | `main` |
| Runtime | Node |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `node dist/index.js` |
| Health check | `/` |

Add these environment variables in **Render → rccg-tap-api → Environment**.

| Variable | Value | Required for |
| --- | --- | --- |
| `NODE_ENV` | `production` | Production runtime |
| `API_ONLY` | `true` | Render API-only deployment |
| `MONGODB_URI` | Full Atlas connection string | All website data and accounts |
| `JWT_SECRET` | Long random secret from a password manager | Secure signed sessions |
| `INITIAL_MASTER_ADMIN_SETUP_TOKEN` | A separate long random secret | One-time Master Admin setup |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Media uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Media uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Signed server-side media uploads |

Click **Create Web Service**, wait for the deployment, and copy the live API URL, for example:

```text
https://rccg-tap-api.onrender.com
```

Opening that URL should return a small JSON health response.

> Do **not** add `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, or `BUILT_IN_FORGE_API_KEY`. TAP now uses its own MongoDB email-and-password account flow.

## 3. Deploy the frontend on Vercel

Import `Alli-ance01/rccgalmightyparish` in Vercel. The committed `vercel.json` sets the expected Vite build values.

| Vercel field | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | `.` |
| Build command | `pnpm vite build` |
| Output directory | `dist/public` |

In **Vercel → Settings → Environment Variables**, add only this production variable:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Your full Render API URL, such as `https://rccg-tap-api.onrender.com` |

Deploy and copy the Vercel production URL.

## 4. Connect Render to Vercel

Return to Render and add the final website origin, with no trailing slash.

| Render variable | Value |
| --- | --- |
| `CORS_ORIGIN` | Your Vercel production URL |
| `WEB_APP_URL` | The same Vercel production URL |

Save these values and choose **Manual Deploy → Deploy latest commit** on Render. Redeploy Vercel after changing `VITE_API_BASE_URL` because Vite reads it at build time.

## 5. Create the first Master Admin account

After Render has redeployed, visit:

```text
https://YOUR_VERCEL_DOMAIN/master-setup
```

Use the fixed initial Master Admin email **`timileyinogunderekingmex@gmail.com`**, choose a password of at least 10 characters, and enter the private `INITIAL_MASTER_ADMIN_SETUP_TOKEN` you stored in Render. This setup succeeds only once.

> Keep the setup token private. Do not paste it in chat, GitHub, Vercel, or a public document.

## 6. Verify staff accounts and Cloudinary

The Master Admin can now sign in at `/sign-in`, then open **Administration → Access requests**. Regular members can register immediately; staff requests remain pending until the Master Admin approves a role.

For Cloudinary, an approved Editor, Admin, or Master Admin can open **Administration → Media** and select **Verify connection**. A successful result confirms the Render credentials without displaying the API secret. Upload a small test image and confirm it appears in the public Media page after it is published.

## 7. Final public checks

Confirm that the Vercel site opens Home, Visit Us, Contact, Give, Ministries, Sermons, Events, Media, Junior Church, Sign in, and Master Admin setup. Verify the contact details, OPay giving information, Sunday timings, and route-scroll reset. Open the browser console and confirm there are no CORS errors.

When a custom domain is added in Vercel, update both `CORS_ORIGIN` and `WEB_APP_URL` in Render to the final domain and redeploy the API.
