# Promoting the first administrator

There's no signup flow for admins on purpose - `role` in `profiles` always starts as `user`
(enforced server-side; signup metadata is never trusted for it - see
[database-schema.md](./database-schema.md)). To create your first admin:

1. Register a normal account through the app at `/register`, and confirm the email if email
   confirmation is enabled on your project.
2. Find that user's UUID: Supabase Dashboard -> Authentication -> Users, or:
   ```sql
   select id, email from auth.users where email = 'you@example.com';
   ```
3. Run this in the SQL Editor (or via `psql`/CLI), replacing the placeholder:
   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'REPLACE_WITH_USER_UUID';
   ```
4. Log out and back in (or just refresh) so the app picks up the new role - `AuthContext` reloads
   the profile on `onAuthStateChange`, but an already-open tab won't see the change until then.
5. You should now see an **Admin** link in the header and be able to visit `/admin`.

To promote additional admins later, repeat step 3 (from the SQL Editor, or from `/admin` if you
build that capability into the UI - it isn't in this initial version, only role promotion via
direct SQL is).

To demote an admin back to a regular user:

```sql
update public.profiles set role = 'user' where id = 'THEIR_UUID';
```
