# Service activation checklist

## Readiness checked on 2026-11-05

The live Vercel project has Supabase and Resend email-test settings. Email-only free testing was authorized: the operator signed in to Resend and stored the key privately, then it was saved as a protected production secret. One WellNest test was accepted and Resend reports Delivered; the owner confirmed receipt in Spam. The connection was deployed with automatic delivery disabled. See `email-setup-status.md`. SMS, scanner hosting and scheduler activation remain outside this email-only setup. No purchases are authorized. Docker, PostgreSQL command-line tools and the Supabase CLI were not found on PATH. No production backup or separate restore database is available.

The live demo test discovered the private report bucket was missing. `medical-reports-private` is now provisioned with public access disabled, a 3 MB limit, and PDF/JPEG/PNG MIME restrictions. This provisions private storage; it does not activate the external malware scanner. See `live-demo-test-report.md` for upload and release-blocking results.

## Free testing scope

- Email: Resend's `onboarding@resend.dev` sender can test delivery to the email associated with the operator's Resend account. This does not permit delivery to arbitrary patients. Create the account and store its key privately; leave the automated worker disabled during this restricted test. [Resend testing restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
- SMS: use only the account's free trial features and verified recipients. Trial template/content restrictions may prevent sending the app's custom reminder text. A console-only SMS test is not proof of the application's SMS workflow. No number purchase or paid upgrade should be made.
- Scanning: a portable local ClamAV engine was verified and tested successfully as described below. No public scanner host is configured and no tunnel or public port was created.
- Recovery: the synthetic local recovery drill is available. Production recovery still needs an actual backup and separate restore target. A new free Supabase project is an option only if the operator's account permits it; it is not created automatically.

## Real local scanner result

Downloaded the official Windows x64 ClamAV 1.5.4 portable ZIP and verified its detached release signature using the Cisco Talos public key linked by ClamAV's documentation. Signer fingerprint: `5BAD CA26 65EF 59DC F8A2 3D8B 707F 0DB4 8083 6771`. FreshClam successfully downloaded and tested the official daily (28173), main (63) and bytecode (339) databases.

`node services/file-scanner/test-local.mjs` passed against that real engine on loopback: a clean sample returned clean, standard harmless EICAR test bytes were quarantined, release of quarantined content was blocked, missing gateway credentials returned HTTP 401, and a gateway outage returned error and blocked release. Test inputs contained no patient data. This is a local engine/gateway test, not a live website upload or production malware-detection guarantee. Portable binaries and downloaded definitions are ignored under `node_modules/.tmp/clamav-test`; no Windows service was installed.

## Email

The application already supports Resend. Create/sign in to the operator-owned [Resend account](https://resend.com/signup), then add a sending domain that you own. Complete the DNS verification shown in Resend. The Vercel website address is not a domain whose DNS you control. Create an approved sender and a sending API key. Keep the key in `.env.services.local` or the Vercel server environment, never in chat. Settings required: `RESEND_API_KEY`, `EMAIL_FROM`.

Reference: [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction).

## SMS

The current adapter uses Twilio. Create/sign in to the operator-owned [Twilio account](https://www.twilio.com/try-twilio), verify your own test recipient and review the account's available trial features. The trial may restrict recipients, countries and message content; it is not equivalent to production delivery. Confirm the permitted sender and message route before purchasing anything. Settings required: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`. Supabase Auth's phone-verification provider needs separate configuration.

For India destinations, follow the actual route-specific sender and template registration steps. Do not assume an arbitrary sender or trial number can deliver the application's reminder text.

References: [Twilio trial restrictions](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account), [India route guidelines](https://www.twilio.com/en-us/guidelines/in/sms).

## Scanner

The private ClamAV gateway and Docker Compose definition are ready in `services/file-scanner`. A Docker-capable host with sufficient memory and an HTTPS address is still required. ClamAV's documentation recommends configuring containers with 4 GB RAM. Keep ClamAV port 3310 private; only the authenticated gateway should be reachable by the app. Configure matching `SCAN_API_TOKEN` values on the gateway and app and set `SCAN_SERVICE_URL` to the HTTPS `/scan` endpoint. Do not start a paid server without the operator's approved cost and location.

Reference: [ClamAV Docker requirements](https://docs.clamav.net/manual/Installing/Docker.html).

## Delivery activation

Keep `DELIVERY_ENABLED=false` during setup. Set `PUBLIC_APP_URL` and a strong `CRON_SECRET`. After provider setup, use the administrator test buttons to send only to that administrator's verified destination, and have the operator confirm actual receipt. Configure an authenticated scheduler for `/api/jobs/delivery`, then enable delivery after those checks. Review queued jobs and existing opt-ins before activation: enabling the worker can process existing jobs. No automatic scheduler has been created.

## Recovery

Connect the operator's Supabase account to inspect available backup options. Supabase recommends manual exports for Free projects; paid-plan daily backups have their own retention. Obtain a real database backup and a separate restricted restore target. Do not restore over production. Uploaded file contents require a separate backup/recovery process.

`supabase/verification/recovery_post_restore.sql` is a read-only diagnostic to run privately on source and restored copies. It compares aggregate counts, booking/attachment conflicts, browser privileges, policies and workflow functions. It does not prove that a backup exists or that uploaded file contents were restored. Follow with test-account workflow and object-hash checks.

References: [Supabase backups](https://supabase.com/docs/guides/platform/backups), [backup and restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
