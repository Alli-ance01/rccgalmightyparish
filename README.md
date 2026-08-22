# TAP Church — RCCG The Almighty Parish

This repository contains the public website and content-management platform for **RCCG The Almighty Parish (TAP)** in Ibadan, Nigeria. It combines a React/Vite public experience, an Express/tRPC API, a MongoDB content database, and S3-backed media storage.

## Local development

Install dependencies with `pnpm install`, then run `pnpm dev`. The project starts the Express application and Vite development server together. Run `pnpm test` for the Vitest suite, `pnpm check` for TypeScript validation, and `pnpm build` for the production build.

## Content management

The `/admin` route provides the staff workspace. New users default to non-editor access. Promote approved accounts through the database to one of the supported roles: `worker`, `ministry_leader`, `editor`, or `admin`. Editors and administrators can create, edit, publish, and remove events, sermons, news, announcements, ministry pages, and media records. Media uploads are stored through S3; only the returned storage metadata is persisted in the database.

## Deployment

Follow **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete MongoDB Atlas → Render → Vercel launch checklist. It lists the only variables required for the first public release and clearly separates later staff-login and media-upload integrations.

## Before launch

Replace any remaining provisional public content with verified parish information. Never publish unverified bank details. Do not enable staff login or media uploading externally until their dedicated production integrations are in place.
