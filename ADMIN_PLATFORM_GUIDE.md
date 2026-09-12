# RCCG TAP Admin Platform Guide and Feature Audit

**Prepared by Manus AI**

**Repository:** [Alli-ance01/rccgalmightyparish](https://github.com/Alli-ance01/rccgalmightyparish)**Audit date:** 12 September 2026

## Executive summary

The RCCG TAP admin platform is a private administrator workspace for managing public church content. It currently supports administrator sign-in, additional administrator creation, events, sermons, announcements, media assets, and prayer-request review. The main content sections switch in place through local interface state, so an administrator can move between them without changing the browser route or reloading the page.

The automated implementation checks are passing. The current validation result is **19 test files passed and 30 tests passed**, together with a successful TypeScript check and production build. This is an implementation audit rather than a live production acceptance test because the sandbox does not have the production administrator session, MongoDB credentials, or Cloudinary credentials. Live tests that depend on those services must be performed after deployment.

One important limitation was found. The backend contains a ministry-page procedure and the admin source contains a `MinistryEditor`, but the visible admin navigation does not currently expose a Ministries tab. Public ministry pages can still read managed ministry records from the database, but administrators cannot currently create or edit those records through the visible workspace. This should be treated as a follow-up feature rather than as an available admin function.

## 1. How to access the platform

| Purpose | URL | Visibility | Function |
| --- | --- | --- | --- |
| Administrator sign-in | `/sign-in` | Direct URL only | Signs an administrator into the private workspace. It is not linked in the public header or footer. |
| Initial setup or recovery | `/master-setup` | Direct URL only | Creates the first administrator or repairs the configured master administrator using the private Render setup token. |
| Main admin workspace | `/admin` | Direct URL only | Opens the administrator dashboard. Unauthenticated visitors are directed to sign in. |
| Legacy prayer route | `/admin/prayer-requests` | Direct URL only | Remains registered as a fallback route. The sidebar now opens Prayer requests inside the main admin workspace instead. |
| Public website | `/` | Public | Displays published church content and public forms. |

The public site does not display a sign-in button, member registration button, worker registration button, or administrator link. This is intentional. Administrators use the direct sign-in URL.

## 2. Authentication and account administration

### 2.1 Administrator sign-in

The sign-in page accepts an administrator email address and password. The server checks the email, compares the password against the stored bcrypt password hash, verifies the account has the `admin` role, and verifies that the account is active. Successful sign-in creates a server session and also stores the session token in per-tab session storage for cross-origin deployments where a Render cookie may not be accepted by the Vercel frontend.

There are no member accounts, worker accounts, editor accounts, leader accounts, or public account-registration flows. Every account that can access the workspace is an administrator account.

### 2.2 Adding other administrators

An authenticated administrator opens the **Administrators** section from the admin sidebar or the workspace tab row. The panel contains two areas.

| Area | Purpose |
| --- | --- |
| Administrator list | Shows the name, email address, and active status of existing administrators. |
| Add an administrator | Creates another administrator with a name, email address, and password. |

The new administrator must receive their credentials securely. The server requires a password of at least ten characters and rejects an email address that already exists. The new account is created as an active administrator immediately.

The current implementation does not yet provide administrator deletion, administrator suspension, role changes, password reset by one administrator, or forced password change on first sign-in. Those are separate security-management features and should be added before the platform is treated as a full account-management system.

### 2.3 Master setup and recovery

The `/master-setup` page is not linked from the sign-in page. It remains available by direct URL because it is needed for first-time setup and recovery. The page requires the configured master email and the private setup token stored in Render.

The protected recovery operation can normalize the configured master account, set a new password, remove non-administrator users, migrate legacy posts into announcements, and remove obsolete member collections. The setup token is validated server-side and is not stored in the repository.

The recovery page should not be used as the normal method for adding administrators. Use the Administrators panel instead.

## 3. Admin navigation behavior

The admin workspace has two navigation layers.

| Navigation | Behavior |
| --- | --- |
| Sidebar | Switches the active admin section in place using a browser `CustomEvent`. It does not change the route or reload the page. |
| Workspace tab row | Switches the active admin section through React state. It also does not change the route. |

The available sections are:

1. Overview

1. Events

1. Sermons

1. Announcements

1. Media

1. Administrators

1. Ministries

1. Prayer requests

Prayer requests are now part of the same local tab state as the other sections. This means an administrator can open Prayer requests and immediately return to Overview or any other section without navigating away.

## 4. Overview panel

The Overview panel is a summary screen. It displays counts for:

| Card | Count source | What it represents |
| --- | --- | --- |
| Sermons | `sermons` collection | All sermon records currently stored, including drafts. |
| Events | `events` collection | All event records currently stored, including drafts. |
| Announcements | `announcements` collection | All announcement records currently stored, including inactive and scheduled records. |
| Media assets | `mediaAssets` collection | All media records currently stored, including unpublished assets. |

Selecting a summary card changes to the corresponding workspace section. The Overview panel does not currently include a count card for prayer requests, administrators, or ministries.

## 5. Events

### 5.1 Purpose

Events are scheduled gatherings, special services, community activities, and other time-based church activities. Published events appear in the public events archive and can appear on the homepage when they are upcoming.

### 5.2 Event fields

| Field | Required | Purpose and destination |
| --- | --- | --- |
| Title | Yes | The event name shown on cards, the event detail page, and homepage event cards. |
| URL slug | Yes | The stable URL identifier. For `worship-night`, the public detail URL is `/events/worship-night`. |
| Excerpt | Yes | Short summary shown on event cards and the homepage. |
| Full description | Yes | Main event content shown on the event detail page. |
| Location | Yes | Displayed in event metadata and on the event detail page. |
| Starts | Yes | Determines event timing, upcoming/past grouping, homepage inclusion, and displayed date. |
| Ends | No | Stores an optional ending time. |
| Registration link | No | Creates a public “Register now” link on the event detail page. |
| Event cover image | No | Uploaded to Cloudinary and displayed on event cards, the event detail page, and the homepage when applicable. |
| Publish on the public website | No | Controls whether public queries can see the event. An unchecked event remains in the admin workspace but is excluded from public listings. |

### 5.3 Event URLs and display locations

The public listing is `/events`. Each published event is linked at `/events/:slug`. The homepage shows up to three upcoming published events, ordered by start time. The event archive divides records into “Coming up” and “Past events”.

The cover upload accepts image files under 18 MB. The frontend checks the MIME type and size before upload. The server also requires an image MIME type and sends the file to Cloudinary.

## 6. Sermons

### 6.1 Purpose

Sermons are the parish message archive. They support video playback links, speaker and series organization, summaries, dates, and optional downloadable notes.

### 6.2 Sermon fields

| Field | Required | Purpose and destination |
| --- | --- | --- |
| Title | Yes | Message title shown throughout the sermon archive and detail page. |
| URL slug | Yes | Stable public identifier. For `faith-over-fear`, the detail URL is `/sermons/faith-over-fear`. |
| Speaker | Yes | Displayed on sermon cards and detail pages and available as a public filter. |
| Series | Yes | Displayed on sermon cards and available as a public filter. |
| Message summary | Yes | Short message description shown in the sermon archive. |
| Video provider | Yes | One of `none`, `youtube`, or `vimeo`. |
| YouTube/Vimeo video ID | No | The provider-specific video identifier used by the sermon detail page. |
| Sermon notes title | No | Label for the notes link. |
| Sermon notes URL | No | External or stored notes link. |
| Cover image URL | No | Approved image URL displayed on sermon cards and the detail page. |
| Publish date | No | Display date and sorting value. |
| Publish on the public website | No | Controls public visibility. |

### 6.3 Sermon URLs and display locations

The public archive is `/sermons`. Each published sermon is linked at `/sermons/:slug`. The public archive supports search by title, summary, speaker, and series, plus filters for series, speaker, and date range. The homepage displays the most recent available sermon.

The video provider and video ID must be entered consistently. The system stores the values but does not verify that the external YouTube or Vimeo video actually exists. That should be checked manually before publishing.

## 7. Announcements

### 7.1 Purpose

Announcements are the single replacement for the former news area. They are intended for service notices, special instructions, church-office updates, time-sensitive information, and other parish communications.

### 7.2 Announcement fields

| Field | Required | Purpose and destination |
| --- | --- | --- |
| Title | Yes | Headline shown on homepage announcement cards, the archive, and the detail page. |
| Message | Yes | Main announcement body. Line breaks are preserved in the public presentation. |
| Button label | No | Optional call-to-action text. |
| Button link | No | Optional URL opened by the call-to-action. |
| Start | No | The time from which the announcement becomes active. |
| End | No | The time after which the announcement stops being active. |
| Announcement active | Yes | Master visibility switch. An inactive announcement is hidden from public queries. |

### 7.3 Announcement status rules

An announcement is **Active** when its active switch is enabled, its start time is empty or has passed, and its end time is empty or has not passed. It is **Scheduled** when it is active but its start time is in the future. It is **Expired** when its end time has passed. It is inactive when the active switch is disabled.

Only active announcements inside their configured time window are returned by public queries. Inactive, scheduled, and expired records remain visible to administrators through the admin workspace.

### 7.4 Announcement URLs and display locations

The public archive is `/announcements`. Each announcement detail page is `/announcements/:id`, where `id` is the MongoDB record identifier rather than a manually entered slug.

Active announcements can appear in these locations:

- The homepage announcement section.

- The homepage latest-announcement card.

- The public `/announcements` archive.

- The individual announcement detail page.

- Any site-wide announcement strip or notice component that reads the active announcement feed.

The admin editor includes a visitor preview so the administrator can review the title, message, and action label before saving.

## 8. Media

### 8.1 Purpose

Media stores images, videos, and documents in Cloudinary while keeping searchable metadata in MongoDB. It is intended for reusable public assets and future media-library presentation.

### 8.2 Upload fields

| Field | Required | Purpose |
| --- | --- | --- |
| Title | Yes | Internal and public asset label. |
| Alt text | No but recommended for images | Accessibility description for images. |
| Asset type | Yes | Image, video, or document. |
| File | Yes | The file sent to Cloudinary. |
| Publish on the public website | No | Controls whether public media queries return the asset. |

The upload flow accepts files under 18 MB. The file selector narrows accepted file types based on the chosen asset type. Supported document extensions include PDF, Word, PowerPoint, Excel, and text formats.

### 8.3 Cloudinary workflow

The Media editor first checks whether the three Render variables are configured:

- `CLOUDINARY_CLOUD_NAME`

- `CLOUDINARY_API_KEY`

- `CLOUDINARY_API_SECRET`

The **Verify connection** button performs a server-side configuration check without revealing the secret. Uploads are converted into data URLs in the browser and sent to the server, which uploads them to Cloudinary and stores the secure URL, public ID, MIME type, publication flag, and creator ID in the `mediaAssets` collection.

Existing media records can be edited for title, alt text, and publication state. The stored file itself cannot be replaced from the metadata editor. Upload a new asset when the underlying file must change.

### 8.4 Media URLs and display locations

The public media archive is `/media`. Individual media records are available at `/media/:id`. Published media records are returned by public media queries. The current admin platform does not attach media automatically to every content type; event covers use their own upload flow, while sermon and ministry cover fields currently accept approved image URLs.

## 9. Prayer requests

### 9.1 Public submission

The public homepage contains the prayer request form. Visitors can submit:

| Field | Rule |
| --- | --- |
| Name | Optional, maximum 120 characters. |
| Email | Optional, but must be a valid email when provided. |
| Prayer request | Required, 10–4000 characters. |
| Follow-up requested | Boolean choice. |

Every new request is stored with status `new` and no reviewer.

### 9.2 Administrator workflow

The **Prayer requests** admin tab lists requests newest first. The administrator can see the submitter name or “Anonymous request”, email when available, follow-up preference, request text, and received timestamp.

The status selector supports:

- `new`: not yet processed.

- `prayed`: the prayer team has responded appropriately.

- `closed`: the request no longer requires active handling.

Updating a status records the reviewing administrator and review timestamp. Prayer requests are protected by an administrator-only procedure. Non-administrator sessions cannot list or update them.

## 10. Ministries

The backend supports ministry records with the following fields:

| Field | Purpose |
| --- | --- |
| Ministry name | Public ministry title. |
| URL slug | Public detail identifier, such as `/ministries/youth`. |
| Audience | `main` or `junior`. |
| Short description | Card summary. |
| Full content | Detail-page description. |
| Leader name | Optional leader display. |
| Leader role | Optional leadership role. |
| Meeting information | Optional meeting details. |
| Hero image URL | Optional approved image URL. |
| Publish on the public website | Public visibility flag. |

The public `/ministries` page merges static ministry identity data with any matching published managed database record. The public detail page can read a managed record by slug.

The **Ministries** section is available from both the admin sidebar and the workspace tab row. It uses the existing administrator-only ministry procedures to create, edit, publish, and delete ministry records. The list includes published and draft records, and the editor supports the fields shown above. The **Audience** field determines whether the record is associated with the main parish or Junior Church. The **Publish on the public website** checkbox controls whether public ministry queries can read the record.

After publishing, a ministry record is available at `/ministries/:slug`. The main `/ministries` page merges a published managed record with the static ministry identity entries, while the ministry detail page displays the managed title, summary, full description, leadership, meeting information, and hero image. A managed record whose slug does not correspond to one of the static ministry identity entries can still be read directly by its detail URL, but it will not automatically appear in the main static ministry grid.

## 11. URL slug explanation

A **URL slug** is the readable, stable part of a public detail-page address. It is not the title itself and it is not a database ID.

The server requires slugs to:

- Use lowercase letters.

- Use numbers where needed.

- Separate words with hyphens.

- Contain no spaces.

- Contain no underscores.

- Contain no punctuation other than hyphens.

Valid examples include:

```
worship-night
christmas-service-2026
faith-over-fear
junior-church
```

Invalid examples include:

```
Worship Night
worship_night
worship/night
worship night!
```

Slugs are used by sermons, events, and ministries. Announcements currently use their MongoDB record ID in public detail URLs, so announcements do not currently have a slug field.

A slug should remain stable after publication. Changing it breaks old links, bookmarks, search results, and any external references. If a published slug must change, the safer product behavior would be a redirect or alias system; the current implementation does not provide one.

The current server validates slug format but does not create a unique database index for slugs in the content save procedures. Administrators should therefore avoid duplicate slugs until uniqueness enforcement is added.

## 12. Publication and editing workflow

The recommended workflow is:

1. Open the appropriate admin section.

1. Select **New** for a new item or **Edit** for an existing item.

1. Complete required fields.

1. Check the slug, links, dates, spelling, and public-facing copy.

1. Leave the publication checkbox off while the content is still a draft.

1. Save the record.

1. Review the public listing or detail page.

1. Publish only after the public presentation is correct.

After successful save, the admin queries are invalidated so the list and summary update without a manual refresh. Delete operations remove the database record and update the admin list and counts.

The current editors use a **Clear form** action to leave the editor and return to the list. This is not a draft-storage feature. Unsaved text is lost when the form is cleared or the page is reloaded.

## 13. Security model

All content mutations use an administrator-only server procedure. The browser interface is not the security boundary. Even if a non-administrator calls a mutation directly, the server checks the session role and returns a forbidden error.

Public procedures are limited to public reading and prayer-request submission. Prayer-request listing and updates are administrator-only. Administrator creation and listing are administrator-only. Password hashes are removed before user objects are returned to the browser.

The platform does not currently include:

- Member accounts.

- Worker accounts.

- Editor, leader, or master-admin role distinctions.

- Administrator removal or suspension.

- Self-service password reset.

- Administrator audit history for content changes.

- Slug uniqueness enforcement.

- Automatic old-slug redirects.

## 14. Test and verification status

| Area | Automated status | What was verified | Live dependency |
| --- | --- | --- | --- |
| TypeScript | Passed | Client and server type checking. | None. |
| Production build | Passed | Vite frontend build and bundled server output. | None. |
| Automated tests | Passed: 19 files, 30 tests | Routes, authentication helpers, prayer authorization, announcements, Cloudinary helpers, content-cover logic, public content behavior, and utility logic. | None. |
| Public routes | Covered | Public and private route registrations are asserted. | Browser deployment. |
| Administrator sign-in | Code reviewed and partially tested | Server role and password checks are present. | Render environment, MongoDB, session cookie/header behavior. |
| Add administrator | Code reviewed | Admin-only route, duplicate-email rejection, password hashing, and list refresh are present. | Authenticated production session and MongoDB. |
| Events | Code reviewed and editor logic tested for cover behavior | Fields, save, delete, cover upload, public listing, detail page, and homepage upcoming-event logic. | Cloudinary for covers and MongoDB for persistence. |
| Sermons | Code reviewed | Fields, filters, public listing, detail URL, and delete/save procedures. | MongoDB and external video links. |
| Announcements | Code reviewed and automated announcement tests passed | Active-window filtering, statuses, save/delete, public archive, homepage cards, and detail page. | MongoDB and deployed clock/time zone behavior. |
| Media | Code reviewed and Cloudinary tests passed | Configuration check, verification, upload limits, metadata editing, publication, and deletion. | Render Cloudinary variables and live Cloudinary account. |
| Prayer requests | Automated authorization tests passed | Public submission, admin-only list/update, statuses, and in-page tab integration. | MongoDB and production session. |
| Ministries | Limitation identified | Backend procedures and public reads exist. | No visible admin tab currently exists. |

The latest local validation command was:

```
pnpm check
pnpm build
pnpm test -- --run
```

The build emits non-blocking warnings about missing analytics placeholders and a large JavaScript chunk. These warnings do not fail the build, but analytics variables should be configured if analytics is intended for production.

## 15. Recommended live acceptance test

After the latest deployment is available, an administrator should perform the following sequence in the production browser:

| Step | Expected result |
| --- | --- |
| 1 | Open `/sign-in`; no setup link or public registration link is visible. |
| 2 | Sign in with an active administrator; `/admin` opens. |
| 3 | Click every sidebar item; each section changes in place without a route change or page reload. |
| 4 | Open Administrators; add a second administrator with a ten-character-or-longer password. |
| 5 | Sign out and sign in using the new administrator credentials. |
| 6 | Create an unpublished event; confirm it appears only in the admin list. |
| 7 | Publish the event; confirm it appears at `/events` and `/events/<slug>`. |
| 8 | Create an announcement with future start time; confirm it is marked Scheduled and absent from public listings. |
| 9 | Move the announcement start time to the present and save; confirm it appears in the public announcement archive and homepage. |
| 10 | Create an unpublished sermon; confirm it is absent from `/sermons`. |
| 11 | Publish the sermon with a valid slug; confirm the archive and `/sermons/<slug>` work. |
| 12 | Verify Cloudinary, upload an image, and publish it; confirm it appears in `/media`. |
| 13 | Submit a prayer request from the homepage; confirm it appears in Prayer requests with status New. |
| 14 | Change the prayer status to Prayed and then Closed; confirm the reviewer and timestamp are recorded server-side. |
| 15 | Verify that a signed-out browser cannot access admin data or prayer requests. |

## References

[1]: https://github.com/Alli-ance01/rccgalmightyparish "RCCG TAP source repository"

[2]: https://github.com/Alli-ance01/rccgalmightyparish/blob/main/client/src/pages/Admin.tsx "RCCG TAP admin workspace implementation"

[3]: https://github.com/Alli-ance01/rccgalmightyparish/blob/main/server/routers/content.ts "RCCG TAP content procedures and validation schemas"

[4]: https://github.com/Alli-ance01/rccgalmightyparish/blob/main/server/routers/prayer.ts "RCCG TAP prayer request procedures"

[5]: https://github.com/Alli-ance01/rccgalmightyparish/blob/main/server/routers/accounts.ts "RCCG TAP administrator account procedures"

[6]: https://github.com/Alli-ance01/rccgalmightyparish/blob/main/DEPLOYMENT.md "RCCG TAP deployment and production troubleshooting guide"
