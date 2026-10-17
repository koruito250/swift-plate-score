# Architecture rules
- Scope all tenant-panel queries and mutations explicitly by the current tenant ID, in addition to RLS, because public waiter read policies can also apply to authenticated users.
- Build evaluation QR URLs through the shared evaluation-link helper so restaurant and table parameters cannot be duplicated or lost.