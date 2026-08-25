# Local Visual Validation

## 2026-08-25 — Interactive parish-platform expansion

The shared access route rendered correctly with the existing single sign-in, member-registration, and staff-access-request entry points. The refreshed Junior Church route rendered the new Family Hub call-to-action, the corrected **Junior Teens** and **0–5** categories, and the parent/guardian safeguarding explanation at desktop size.

Unauthenticated `/member` navigation correctly resolves to the shared sign-in experience. The local preview has no MongoDB connection, so authenticated member, Family Hub, and administrator-only workflows require normal-browser production validation after deployment. The automated test suite covers role restrictions and category contracts.

## 2026-08-25 — Route and landing refinement

The public Junior Church landing now uses a single final Family Hub decision point rather than repeating the same destination across the hero, every age card, and the parent card. Its primary public action scrolls to the age-group overview, while the final parent/guardian action opens Family Hub. The shared sign-in route remains the recovery landing for unauthenticated member requests and legacy `/account` bookmarks. Footer copy now directs visitors to the canonical Visit page rather than retaining provisional channel text.
