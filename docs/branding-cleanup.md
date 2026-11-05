# WellNest branding cleanup

Date: 2026-11-05.

The project package and lockfile now use `wellnest-healthcare`. Application names, browser-storage namespaces, sample email domains, the health-card print selector, schema comments, documentation and the remaining landing component use WellNest branding. The landing component is `WhyWellNest.tsx`. The unused old PNG logo was replaced by `public/wellnest-healthcare-logo.svg`, using the existing WellNest mark and two-color wordmark.

Public Contact and footer links now lead to the website's Support page, as the operator requested. They do not publish a personal email address or an unconfigured branded mailbox. Signed-out visitors can sign in to create and track a private support request.

Remembered email and in-progress Google return information migrate across the browser-storage namespace change. Same-origin, expiry and workspace-return checks remain enforced. Existing patient Health IDs and database records are unchanged.

All 196 regression checks and the production build pass. A complete source/path scan found no remaining old brand name in project-owned source or filenames. The subsequent hosting rollout migrated the public address to `https://wellnest-healthcare.vercel.app/` and renamed the Vercel project to `wellnest-healthcare`; see `domain-migration.md`. Git history, dependencies, immutable deployment records and private credentials are operational data rather than application branding.

The Contact page and its Support link were verified in the staged browser, including the signed-out Support sign-in prompt. Release `dpl_GmPARwTV7LeQnduMnB7LzTgw79bq` was promoted to production after those checks. Automatic email sending remains disabled.

The approved outer folder target is `WellNest HealthCare`. Windows blocked the rename because the active Codex workspace processes hold the directory open. Resetting both JavaScript tool sessions did not release the lock. No folder was moved or overwritten. Close Codex, rename the outer folder in File Explorer, then reopen `WellNest HealthCare` in Codex to finish this filesystem step.

The GitHub repository is now `smitpatil1959-design/WellNest-HealthCare`. Its About description uses WellNest and its website points to `https://wellnest-healthcare.vercel.app/`. The local `origin` fetch and push URLs use the renamed repository; a remote lookup successfully returned the existing `main` branch. Historical commit messages and authors remain intact. This repository-metadata update did not commit or push the outstanding local source changes.
