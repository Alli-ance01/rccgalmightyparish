# TAP Church — RCCG The Almighty Parish

This repository contains the public website and content-management platform for **RCCG The Almighty Parish (TAP)** in Ibadan, Nigeria. It combines a React/Vite public experience, an Express/tRPC API, a relational content database, and S3-backed media storage.

## Local development

Install dependencies with `pnpm install`, then run `pnpm dev`. The project starts the Express application and Vite development server together. Run `pnpm test` for the Vitest suite, `pnpm check` for TypeScript validation, and `pnpm build` for the production build.

## Content management

The `/admin` route provides the staff workspace. New users default to non-editor access. Promote approved accounts through the database to one of the supported roles: `worker`, `ministry_leader`, `editor`, or `admin`. Editors and administrators can create, edit, publish, and remove events, sermons, news, announcements, ministry pages, and media records. Media uploads are stored through S3; only the returned storage metadata is persisted in the database.

## Deployment: Vercel frontend and Render API

The repository supports a split deployment. `vercel.json` configures Vercel to build the React app with `pnpm vite build` and serve the SPA from `dist/public`. `render.yaml` configures an API-only Express service on Render.

| Service | Required configuration | Purpose |
| --- | --- | --- |
| Vercel | `VITE_API_BASE_URL=https://your-api-domain` | Routes browser tRPC and login requests to the API service. |
| Render | `API_ONLY=true` | Runs the Express/tRPC API without serving the compiled frontend. |
| Render | `CORS_ORIGIN=https://your-vercel-domain` | Allows authenticated browser requests from the Vercel frontend. |
| Render | `WEB_APP_URL=https://your-vercel-domain` | Sends a successfully authenticated user back to the public frontend. |
| Render | `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID` | Enables the database and OAuth session flow. |

For production, use custom subdomains on the same parent domain, such as `www.yourchurchdomain.com` for Vercel and `api.yourchurchdomain.com` for Render. This offers a more reliable authenticated browser experience than unrelated temporary domains. The OAuth provider must also allow the Render callback URL: `https://api.yourchurchdomain.com/api/oauth/callback`.

## Before launch

Replace the provisional contact copy with verified parish phone, email, social links, campus directions, account details, leadership profiles, and the official TAP logo. Never publish unverified bank details. Confirm that the database and storage credentials are present on Render before staff upload media or publish content.
