# Admin TOTP MFA Runbook

## Before rollout

- [ ] Review and apply `supabase/migrations/20261008c_remove_public_faq_submissions_read.sql` in production after authorization. The legacy `auth read submissions` policy grants any signed-in user read access despite the admin policy. Confirm the returned `faq_submissions` policies contain no separate SELECT policy.
- [ ] Supabase TOTP enrollment, challenge, and verification are enabled.
- [ ] The admin can sign in with the existing Email and password.
- [ ] Two independent authenticator locations are available.
- [ ] The Supabase project dashboard account has its own MFA and a recovery method outside the same phone.

## Enrollment

1. Deploy the tested frontend and Pages Functions without applying the RLS migration yet.
2. Sign in at `/login` and name the first factor by device or app.
3. Scan and verify the first factor.
4. Add and verify the second factor on an independent device or password manager.
5. Sign out, then prove that each factor can complete a fresh login.

## Activate database enforcement

1. Apply `supabase/migrations/20261017_require_admin_aal2.sql` after both factors pass fresh login.
2. Review the migration's `pg_policies` output and confirm every authenticated admin policy still calls `is_admin()`.
3. Confirm an `aal1` token cannot read or write protected admin rows.
4. Confirm an admin `aal2` token can perform the representative smoke tests below.

## Smoke tests

- [ ] Create and edit a draft post.
- [ ] Save one reversible site-setting change, then restore it.
- [ ] Upload a disposable image and remove it.
- [ ] Load the subscriber list.
- [ ] Send email and push only to an approved test target; do not broadcast during smoke testing.
- [ ] Call one admin Pages Function with `aal1` and confirm `403 MFA_REQUIRED`.

## Replace one lost factor

1. Sign in with the remaining factor.
2. Add and verify a replacement, producing three verified factors.
3. Remove the lost factor and confirm two verified factors remain.

## Recover after losing both factors

1. Sign in to the protected Supabase project dashboard.
2. Remove the unavailable factors from the intended Auth user only.
3. Sign in to QA Lens and complete the forced two-factor enrollment again.
4. Repeat both fresh-login checks and the smoke tests.

## Emergency RLS rollback

Apply `supabase/rollback/20261017_require_admin_aal2.sql` only when the MFA flow or provider is unavailable and admin operations are blocked. Record the reason and time, restore the forward migration as soon as the incident is resolved, and repeat the `aal1` denial check.

Never paste QR codes, TOTP secrets, one-time codes, refresh tokens, access tokens, or private account data into this document or logs.
