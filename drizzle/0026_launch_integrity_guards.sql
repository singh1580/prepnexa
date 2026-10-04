-- Historical accounts created before role assignment became mandatory must
-- remain usable in the student workspace.
insert into "user_roles" ("user_id", "role_id")
select u."id", r."id"
from "users" u
join "roles" r on r."key" = 'STUDENT'
where not exists (
  select 1 from "user_roles" ur where ur."user_id" = u."id"
)
on conflict do nothing;
--> statement-breakpoint
-- Expired sessions can never authenticate again; marking them revoked keeps
-- the active-session UI and operational counts free of stale rows.
update "sessions"
set "revoked_at" = now()
where "revoked_at" is null
  and "expires_at" <= now();
--> statement-breakpoint
-- Do not advertise packages whose linked content cannot be consumed. Existing
-- entitlements remain valid; this only removes incomplete packages from sale.
update "products" p
set "is_live" = false, "updated_at" = now()
where p."is_live" = true
  and (
    (
      not exists (select 1 from "product_tests" pt where pt."product_id" = p."id")
      and not exists (select 1 from "product_materials" pm where pm."product_id" = p."id")
    )
    or exists (
      select 1 from "product_tests" pt
      where pt."product_id" = p."id"
        and (
          not exists (select 1 from "test_sections" ts where ts."test_id" = pt."test_id")
          or exists (
            select 1 from "test_sections" ts
            where ts."test_id" = pt."test_id"
              and not exists (select 1 from "test_questions" tq where tq."section_id" = ts."id")
          )
        )
    )
    or exists (
      select 1 from "product_materials" pm
      where pm."product_id" = p."id"
        and not exists (select 1 from "material_versions" mv where mv."material_id" = pm."material_id")
    )
  );
