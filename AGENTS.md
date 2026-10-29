# Architecture rules
- Scope all tenant-panel queries and mutations explicitly by the current tenant ID, in addition to RLS, because public waiter read policies can also apply to authenticated users.
- Build evaluation QR URLs through the shared evaluation-link helper so restaurant and table parameters cannot be duplicated or lost.
- Master management functions verify the caller's super_admins row through the authenticated client before dynamically importing the privileged client; never expose bootstrap or password resets as public endpoints.
- Compute general administrator subscription totals with tenant-metrics so all dashboard indicators use one tested definition.
- Use page-meta for leaf route social metadata to keep titles and descriptions consistent without duplicating tag lists.
- Share the PasswordInput control between customer and master login so password visibility never changes credential storage or authentication behavior.
- Keep PWA registration in one guarded wrapper, disabled in dev/previews; generate the worker through vite-plugin-pwa and never cache private HTML, API responses or QR evaluation URLs, because tenant data must not persist in offline caches.
- Render the global installation dialog from the root shell; keep native installation browser-controlled and offer dismissible platform instructions when unavailable.