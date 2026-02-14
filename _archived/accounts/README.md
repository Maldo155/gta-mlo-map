# Archived: Account / Login / MyMLOs

**Archived:** Account system paused. All account-related features removed from the live site.

## Live site changes (as of archival)

- `/login` and `/account` now redirect to `/`
- `HeaderAuthLink` removed from headers (page.tsx, map/page.tsx, submit/page.tsx)
- `app/api/account/` deleted
- `app/components/HeaderAuthLink.tsx` deleted
- `app/lib/userAuth.ts` deleted

## To restore

1. Copy contents of `_archived/accounts/app/` back to `app/` (login, account, components/HeaderAuthLink, api/account, lib/userAuth)
2. Re-add `HeaderAuthLink` to the header in: page.tsx, map/page.tsx, submit/page.tsx
3. Replace the redirect-only login and account pages with the archived page components
4. Ensure Supabase has: profiles, saved_mlos, account_type columns, creator/city fields
5. Run any migrations in docs/account-schema.md

## Contents

- `app/login/page.tsx` - Login/signup page (Creator, Player, City Owner)
- `app/account/page.tsx` - MyMLOs / My Account page
- `app/components/HeaderAuthLink.tsx` - Header link (MyMLOs / Login)
- `app/api/account/` - Profile, my-mlos, saved, reviews APIs
- `app/lib/userAuth.ts` - requireUser helper for account APIs
