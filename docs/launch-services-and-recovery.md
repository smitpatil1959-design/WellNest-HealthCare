# Launch services and recovery

## Current verification

On 2026-11-05, all 193 release checks passed and the production build completed. The tests execute the API handlers against isolated PostgreSQL (PGlite), applying migrations 001–015. Authentication responses and object storage in that suite are fixtures. Separate live Google sign-ins for administrator, patient and doctor, administrator authenticator enrollment/challenge, consent, shared booking, consultation, revocation, backend health and saved support checks passed; see `live-acceptance-checklist.md`. The authorized seven disposable accounts used real password sign-ins and deployed APIs; the final post-015 live run passed **17/17 workflow groups**, including 61 menu/settings endpoint reads. Temporary accounts, organizations, their workflow rows and uploaded objects were removed and verified. See `live-demo-test-report.md` for actual outcomes, rather than treating fixture tests as live evidence.

| Area | Verified locally | Still requires live verification |
| --- | --- | --- |
| Seven portals | Patient consent and revocation; doctor appointments, consultation and prescriptions; hospital charts and atomic discharge; laboratory verification and atomic release; pharmacy transitions; insurance consent and claim review; administrator boundaries. All seven roles also passed the disposable live backend run | Complete visual/browser acceptance for every UI state remains separate from backend workflow coverage |
| Two-factor | Verified-factor API protection, AAL2 identity binding, profile access policy, recovery tickets cannot bypass MFA; live administrator enrollment and code challenge passed | Repeat role-specific acceptance as remaining test accounts sign in; operator recovery procedure |
| Scheduling | Overlap and double-booking prevention; failed reschedule preserves original booking; timezone storage | Real doctor publishing, patient reservation, cancellation and slot closure passed; live contention results are in the disposable-account report |
| Support/privacy | Tracked requests, owner-only messages, administrator replies, own-account export | Operator identity verification, deletion/retention decisions and approved policy text |
| Reminders | Opt-in, verified destinations, generic message content, stale appointment checks, retries and uncertain outcome handling | Providers, verified sender, scheduler, actual receipt |
| File scanning | Raw-byte private gateway protocol, digest binding, failure/quarantine blocking, upload/release/download restrictions; real ClamAV 1.5.4 local clean/EICAR gateway test | Deploy the private scanner and verify actual lab upload/release against it |
| Recovery | Compressed local snapshot restored into a separate database; table counts, restricted privileges, functions and notification trigger checked | Production backup restoration and private storage object recovery |

Portal reads refresh every 15 seconds while visible and on window focus. This is polling, not a verified WebSocket realtime subscription. Booking and releases commit through database transactions.

## Database rollout

Run `supabase/verification/migration_013_preflight.sql`. The duplicate active attachment query must return zero rows; resolve duplicates with responsible staff rather than deleting files blindly. Run `supabase/migrations/013_scheduling_support_delivery.sql` after 012. It is transactional and adds no sample patients. Apply the database update before publishing dependent application code.

Migration 014 was also applied successfully. It records the authenticated issuer and source for future clinical writes. Patient uploads remain pending uploads; historical records without an issuer display unknown. Do not infer source from names or signed status text.

Migration 015 was applied by the operator on 2026-11-05. It replaces retryable serialization error codes used for business conflicts with HTTP conflict codes in five functions, preserving their signatures and access permissions. The subsequent live slot contention, overlap, rescheduling, cancellation and slot-closure checks passed. The updated local suite passes 193 tests, including permission checks and recovery. See `live-demo-testing.md` for rollout and bounded cancellation of aged retrying calls.

## Secret settings

Use `.env.services.example` as the setting-name reference. Set secrets in the server deployment environment, never in browser-prefixed `VITE_` variables or chat. Keep `DELIVERY_ENABLED=false` until setup and receipt tests are complete.

### Email and SMS

1. Configure a Resend account and verified sending domain. Set `RESEND_API_KEY` and `EMAIL_FROM` to an approved sender.
2. Configure Twilio and an approved sending number. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM` (international E.164 format).
3. Phone verification in Settings uses Supabase Auth. Configure its phone/SMS provider separately; the application worker's Twilio settings alone do not activate Supabase verification messages.
4. Set `PUBLIC_APP_URL` to the actual HTTPS site. Set a strong random `CRON_SECRET`.
5. In Administrator → Health, send an explicit setup test to that administrator's own verified destination. Confirm receipt. Provider acceptance is not delivery confirmation; delivery-status webhooks are not implemented.
6. Configure an external scheduler to call `GET` or `POST /api/jobs/delivery` with `Authorization: Bearer <CRON_SECRET>` every few minutes. No scheduler is installed by this release. Check hosting limits before choosing frequency.
7. Enable delivery only after approved sender and receipt checks. Normal jobs require the recipient's email/SMS opt-in. Messages contain a generic sign-in link, without clinical details. Appointment reminders currently cover slot-based appointments within the next 24 hours.

Inspect the administrator delivery queue for failed and uncertain jobs. Do not automatically replay uncertain sends; a provider might already have accepted them. Accepted jobs do not become delivered without separate receipt verification. This is not a critical-result escalation or emergency alert system.

### Private scanning

The deployable gateway is in `services/file-scanner/` with `compose.yaml` and a Dockerfile. Configure its gateway token and ClamAV host as described by those files. Keep the ClamAV TCP port private and maintain virus signatures. Expose the gateway only through authenticated HTTPS; set server-side `SCAN_SERVICE_URL` (ending `/scan`) and matching `SCAN_API_TOKEN` on the app.

Use an isolated test environment for clean and EICAR test-file checks. Confirm that a clean file can release, an infected file is quarantined, and scanner outage leaves the file blocked. Automated unit tests use a fixture verdict engine; the separate manual `services/file-scanner/test-local.mjs` also passed against the real local ClamAV engine and official signatures. Live website uploads have not been tested against a deployed scanner. Files are limited to 3 MB. Pending/error files can be rescanned by an authorized lab verifier; quarantined files require a reviewed new version. No external scanner is configured by this release.

## Support and authenticator recovery

Users can submit support, account export, deletion-review and lost-authenticator tickets. Administrators can reply and track status. Do not treat ticket submission or email access as identity verification. Recovery does not automatically remove an authenticator; an authorized operator must establish a documented identity check before any privileged recovery action. Account deletion is a review request, not immediate deletion. The operator must approve the privacy policy, retention rules and legal terms before launch.

## Backup recovery drill

The local recovery test is in `tests/launch-workflows.test.mjs` and runs with `npm test`. It creates synthetic records, snapshots the local database, restores it into an independent copy, compares all public-table row counts, checks browser privileges and workflow functions, and verifies a trigger write in the restored copy does not change the original. It does not read or alter production data.

For production recovery, obtain an actual recent Supabase backup and a separate restricted restore target first. Record backup time, intended recovery point and acceptable outage. Restore into that target, check counts and representative relationships, permissions, auth integration and workflows using test accounts. Database backups alone do not prove private storage binaries are recoverable: preserve and validate a separate object inventory and recovery copy, compare object sizes/hashes, and test authorized downloads. Keep recovered outbound messaging disabled. Record actual recovery time and any data gap. Never point the production site at a restored database until the operator has reviewed the result. No production restore was performed because no backup or separate target was available.
