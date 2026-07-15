# Manual testing checklist

Run this once you have a live Supabase project with the migration + seed applied (see
[supabase-setup.md](./supabase-setup.md)) and at least one admin account (see
[admin-setup.md](./admin-setup.md)). Automated coverage for the pure-logic pieces (row mapping,
slug generation, form validation, route guards, logo validation, the contact-visibility rule) is
in `npx vitest run` - this checklist is for the parts that need a real database, a real browser,
and a real deploy target.

1. [ ] Existing categories render on `/` and in the header dropdown - all 20.
2. [ ] Existing seeded vendors render on their category pages (e.g. `/pms` shows ~18 providers).
3. [ ] Category filters (pricing model, price range, target market, product) narrow the results.
4. [ ] The homepage search box returns matches across categories and links to the right category
       page with `?q=` prefilled.
5. [ ] Clicking a listing card opens its `/vendor/:slug` detail page.
6. [ ] Visiting `/add-business` while logged out shows a login prompt, not the form.
7. [ ] A new user can register at `/register` and receives a confirmation email.
8. [ ] A confirmed user can log in at `/login`.
9. [ ] A logged-in user can submit a vendor via `/add-business`, including a logo upload.
10. [ ] The new vendor is created with `status = pending` (check `/dashboard/listings`).
11. [ ] The pending vendor does **not** appear on its category page or in search while logged out
        or as a different user.
12. [ ] The owner can see their own pending submission at `/dashboard/listings`.
13. [ ] A second (different) user cannot see or reach that pending submission's edit page.
14. [ ] The owner cannot approve their own listing (no approve control exists outside `/admin`,
        and the RPC rejects it even if called directly).
15. [ ] An admin can approve the listing from `/admin/listings/:id`.
16. [ ] Once approved, the listing becomes publicly visible on its category page and at
        `/vendor/:slug`.
17. [ ] Rejecting a listing (with a reason) shows that reason on the owner's `/dashboard/listings`.
18. [ ] Logo upload works end-to-end (preview shows, and the uploaded image appears on the card
        and detail page after approval).
19. [ ] Uploading an invalid file (wrong type, or over 2 MB) is rejected client-side with a clear
        message.
20. [ ] Placeholder contact info from the seed data (email/phone) is hidden on cards and the detail
        page - only the website link shows, since `contact_verified = false` for every seeded
        listing.
21. [ ] Refreshing the browser on a nested route works on both deploy targets: try `/pms`,
        `/vendor/some-slug`, `/dashboard`, `/admin` after a hard refresh, not just in-app
        navigation.
22. [ ] `npm run lint` succeeds.
23. [ ] `npm run build` succeeds (and `npm run build` with `VITE_BASE_PATH=/traveltech-hub/` set,
        for the GitHub Pages build path).
