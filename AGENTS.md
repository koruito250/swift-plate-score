# Architecture rules
- Scope all tenant-panel queries and mutations explicitly by the current tenant ID, in addition to RLS, because public waiter read policies can also apply to authenticated users.
- Build evaluation QR URLs through the shared evaluation-link helper so restaurant and table parameters cannot be duplicated or lost.
- Master management functions verify the caller's super_admins row through the authenticated client before dynamically importing the privileged client; never expose bootstrap or password resets as public endpoints.
- Compute general administrator subscription totals with tenant-metrics so all dashboard indicators use one tested definition.
- Use page-meta for leaf route social metadata to keep titles and descriptions consistent without duplicating tag lists.
- Share the PasswordInput control between customer and master login so password visibility never changes credential storage or authentication behavior.