# WellNest website address

Date: 2026-11-05 (Asia/Calcutta).

New public address: https://wellnest-healthcare.vercel.app/

The free Vercel subdomain was added, verified and assigned to the existing production deployment. The existing Vercel project was renamed to `wellnest-healthcare`; its project ID remains `prj_B72AGxyT9y2BFXeXLMVZ86o3ix2V`. Existing production secrets, database connection and portal data remain with that same project. No domain or paid plan was purchased.

After operator approval, the Supabase Site URL was saved as the new address. The allowed return destinations include the exact website root, `/auth/callback`, and `/reset-password` on that address. The Google provider's Supabase callback remains with the same Supabase project; no Google client secret was changed.

Current source configuration, email links, test helpers, public metadata, sitemap and local public URL settings use the new address. Production `PUBLIC_APP_URL` and `VITE_APP_URL` were updated. Automated email delivery remains disabled and the test sender is unchanged.

All 196 regression checks and the production build passed. Release `dpl_DGMdxy8Yzrq97bz8cdA2K5XUN6d6` was promoted from `https://wellnest-healthcare-4lzt2nzzu-smitpatil1959-1013s-projects.vercel.app/`. New deployments now use the WellNest project name. Earlier immutable deployment URLs remain historical records.

Live Google sign-in from the new public hostname returned to its authenticator screen. The operator entered the code privately, and `/app/admin` opened on the new hostname with the existing six accounts and three organizations. The system-health page then showed all seven measured backend services Available, Email Configured, automatic delivery Not activated, and SMS setup still needed. No additional test email was sent.

Public homepage, login, authentication callback, password-reset and Support routes returned HTTP 200. The admin integrations API returned HTTP 401 without credentials. Browser canonical and Open Graph URLs use the new origin without including sign-in tokens or query parameters. Production URL checks confirmed both server and client website addresses and disabled automatic email sending without exposing secret values.

The old public address is now a permanent HTTP 308 redirect to WellNest. Checks confirmed preservation of the root, login path, patient-record path with its query string, and a synthetic health-ID verification path. Existing bookmarks, QR links and previously sent email links therefore retain their destination paths.

The existing 17-group portal report predates this hostname migration; it is separate from the new-host checks recorded here. This migration changed hosting and authentication URL configuration, not patient records, portal roles, passwords or authenticator factors. No new account or paid resource was created.
