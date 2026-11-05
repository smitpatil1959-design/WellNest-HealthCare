# Free email setup

The current website address was subsequently migrated to `https://wellnest-healthcare.vercel.app/`; see `domain-migration.md`. The original received test email predates that hostname change. The sender and delivery-disabled setting remain unchanged. Production email-link configuration now uses the new hostname, and the new-host administrator page confirms Email Configured with automatic delivery Not activated.

Date: 2026-11-05 (Asia/Calcutta).

Scope: free testing to the operator's own Resend account email. Sender: `WellNest <onboarding@resend.dev>`. Automatic patient messaging stays disabled. No SMS or scheduler is activated, and no sending domain or paid service is purchased.

The operator signed in to Resend and saved the sending key privately in the ignored `.env.services.local` file. Never commit or paste that key in chat. Local files matching `.env.*.local` are also excluded from Vercel CLI deployment uploads. The sending key was passed directly into a protected Vercel server environment variable without printing it or putting it in command arguments.

One WellNest test was accepted using the same provider adapter as the website. The Resend Emails dashboard reports **Delivered** for the subject `Your WellNest update`. The owner confirmed finding it in **Spam**. Actual receipt is confirmed; placement in the main Inbox is not claimed. The operator was advised to mark it Not spam.

The production connection is saved and deployed. Only `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_APP_URL`, and `DELIVERY_ENABLED=false` were written to the existing production project. `EMAIL_TEST_RECIPIENT` stays local. SMS and scheduler settings were not changed. No automatic worker was activated and existing queued messages were not replayed.

Release: `dpl_GckVTZDyxT253DJAePtWQUR3Z8Sf`, promoted to `https://wellnest-healthcare.vercel.app/`. The production build passed. A metadata-only environment check confirmed the expected sender, website URL and disabled delivery setting without printing their values. The API key is stored as a Secret. Staged homepage/login checks returned HTTP 200 and `/api/admin/integrations` returned HTTP 401 without credentials, preserving admin protection.

The setup safety test passes: unrelated service keys cannot be uploaded, the target and test sender are restricted, and automatic delivery cannot be enabled by this helper. The send was a direct live test of the existing provider adapter; it did not enable the queued-message worker. SMTP authentication emails, arbitrary patient recipients, automatic reminder scheduling and delivery-status webhooks are separate work. A verified sending domain and a sender on that domain are needed before sending to other recipients.

References: [Resend test-sender restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain), [Vercel ignored local environment files](https://vercel.com/docs/builds/build-features).
