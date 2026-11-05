# Shared portal workflows

The first functional upgrade replaces browser-only hospital data, pharmacy stock and administrative account changes with organization-scoped server APIs.

## Database

Apply `supabase/verification/migration_012_preflight.sql`, resolve any conflicting appointment slots, then apply `supabase/migrations/012_shared_portal_workflows.sql` after migrations 001–011. The migration is transactional and additive. It contains no sample patient records. Existing browser-local hospital data is not automatically imported into the shared database.

Migration 010 has been restored to executable SQL. Its original development notes are preserved in `docs/professional-approval-original-notes.md`.

## Hospital

Hospital members load shared charts, clinician rosters, departments, admissions, appointments, report notes, laboratory worklists and discharge drafts. The API derives the hospital and capabilities from active, verified membership. Browser role previews do not change access.

An optional Health ID links a chart to an existing patient only with current clinical-history consent. New consultation notes, report notes and released discharge summaries are then added to that patient's Medical Records with an in-app notification. An unlinked chart remains hospital-local. Registration does not create an authentication account, verify a clinician or grant access to a patient's existing records.

Preparing an admission for discharge creates one shared draft. An authorized hospital clinician can release it. The release, admission closure, patient record and audit writes commit together. Released summaries cannot be overwritten. Inventory adjustments and hospital edits use version checks to detect conflicting staff changes.

Hospital laboratory worklists track internal requests; they do not dispatch an order automatically to an external laboratory. Hospital campus appointments and patient requests to verified doctors remain distinct schedules.

## Pharmacy and administration

Pharmacists can create inventory batches and save stock counts for their pharmacy. Technicians have read access; cashiers have no inventory access. The database enforces nonnegative counts and unique SKU/batch combinations. Prescription verification and dispensing still require patient consent through the existing pharmacy APIs.

Administrators see saved accounts, organizations and the latest 500 audit events. Suspension changes the account status in the database and the server refuses subsequent API requests. Account suspension cannot grant a role, suspend the current administrator or suspend another administrator. The account's existing authentication session is not deleted. Audit downloads contain real CSV data rather than a simulated success message.

Health checks measure current access to application tables. They do not certify infrastructure uptime, backups, file scanning or delivery of external notifications.

## Appointments

Patients can cancel or reschedule their own upcoming appointments. Migration 013 adds clinician availability calendars, clinic timezones and atomic slot reservation. Legacy date/time requests remain available only for clinicians without an enabled calendar.

## Validation

`npm test` covers authentication/navigation, API authorization boundaries, input validation and PostgreSQL migration/transaction behavior using PGlite. `npm run build` checks TypeScript and the production bundle. Browser checks use an isolated, clearly labeled sample-data preview. They do not establish that every live account or clinical workflow has passed acceptance testing.

## Remaining launch work

- Live acceptance tests across all seven existing Google test accounts, including user-controlled authenticator setup.
- Email/SMS provider configuration, verified senders, authenticated scheduler and receipt tests. Critical-result escalation remains separate work.
- Deployment and validation of the private ClamAV scanner. Pending files remain blocked.
- Operator approval of privacy/terms, retention and identity-verified recovery/deletion procedures.
- Production backup and storage restoration into a separate target; external operational monitoring.

Migration 013 and application code implement enrollment/challenges, scheduling, support, exports, delivery adapters and a private scanner gateway. Local restore and workflow checks pass. Provider activation and live acceptance are separate. See `docs/launch-services-and-recovery.md` for the verification matrix and setup steps.
