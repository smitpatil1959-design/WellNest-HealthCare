# Disposable live portal test report

Run: 42e85969-07cf-4c5b-82e4-fa4c6e7aa79b
Started: 2026-11-05T04:43:08.037Z
Site: https://wellnest-healthcare.vercel.app

The original workflow run preceded this hostname migration. This is the current website address; see `domain-migration.md` for the separate new-host rollout verification.
Release: dpl_5i6oBGDnRqZWYx5estcyFX6bp9RA
Database: migrations 012–015 applied; final run after 015.

Result: **17/17 live workflow groups passed**, including 61 menu/settings endpoint reads across the seven roles. The full local suite passes **193 tests** and the production build passes. All seven temporary accounts, four QA organizations, dependent workflow rows and uploaded test objects were removed and verified. No existing account was re-roled or deleted.

Normal Supabase password sign-ins and real deployed HTTP endpoints; no authentication fixtures. Only temporary synthetic accounts and organizations were changed.

| Check | Result | Detail |
| --- | --- | --- |
| seven normal sign-ins and portal backend reads | PASS |  |
| anonymous and wrong-role access blocked | PASS |  |
| portal menu data endpoints and account settings load | PASS |  |
| patient identity and upload attribution | PASS |  |
| five patient-approved provider consent requests | PASS |  |
| shared calendar and simultaneous booking conflict | PASS |  |
| doctor consultation, prescription and recipient share | PASS |  |
| pharmacy dispensing transitions and patient notification | PASS |  |
| pharmacy inventory persistence and stale edit protection | PASS |  |
| hospital admission, clinician-only discharge and linked records | PASS |  |
| laboratory verified structured release reaches patient | PASS |  |
| private upload and unscanned release/download protection | PASS |  |
| insurance policy, claim review and revoked consent | PASS |  |
| private support, admin reply, export and delivery queue | PASS |  |
| revocation closes provider record and shared-link access | PASS |  |
| administrator suspension blocks access without changing the role | PASS |  |
| real authenticator enrollment, AAL2 and recovery isolation | PASS |  |

Cleanup: verified: accounts, organizations, workflow rows and uploaded objects removed.

Corrections verified: report shares now retain the authorized recipient; the patient insurance route loads; private upload storage exists with public access disabled; business conflicts use PT409 after migration 015. Simultaneous booking returned exactly one success and one conflict. Overlap rejection, rescheduling, cancellation and slot closure passed. The unrelated legacy restore hook was also removed; the underlying calendar timeout required the database conflict-code correction.

These checks do not certify every UI page or guarantee absence of errors. Views refresh by polling, not WebSocket subscriptions. No email/SMS messages were sent. Public malware scanning and production backup restoration require their external services. Local ClamAV and synthetic recovery drills are separate evidence. No patient information, passwords, tokens or MFA secrets are included.
