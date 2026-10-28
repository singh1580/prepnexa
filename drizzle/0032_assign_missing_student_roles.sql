-- Repair legacy/manual accounts created without an RBAC assignment. The
-- application registration flow assigns STUDENT atomically, but production
-- integrity must not depend on every historical import having done so.
insert into "user_roles" ("user_id", "role_id")
select u."id", r."id"
from "users" u
join "roles" r on r."key" = 'STUDENT'
where not exists (
  select 1 from "user_roles" ur where ur."user_id" = u."id"
)
on conflict do nothing;
