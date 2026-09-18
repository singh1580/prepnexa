DO $$
DECLARE
  public_table_count integer;
  seeded_role_count integer;
  seeded_permission_count integer;
BEGIN
  SELECT count(*) INTO public_table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  IF public_table_count <> 60 THEN RAISE EXCEPTION 'Expected 60 public tables, found %', public_table_count; END IF;

  SELECT count(*) INTO seeded_role_count FROM roles;
  SELECT count(*) INTO seeded_permission_count FROM permissions;
  IF seeded_role_count <> 6 THEN RAISE EXCEPTION 'Expected 6 roles, found %', seeded_role_count; END IF;
  IF seeded_permission_count <> 30 THEN RAISE EXCEPTION 'Expected 30 permissions, found %', seeded_permission_count; END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role') THEN
    RAISE EXCEPTION 'Obsolete users.role column still exists';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='provider') THEN
    RAISE EXCEPTION 'Provider-neutral payments.provider column is missing';
  END IF;

  BEGIN
    INSERT INTO products (slug, name, price_paise, access_days) VALUES ('invalid-constraint-probe', 'Invalid probe', -1, 90);
    RAISE EXCEPTION 'products price constraint did not reject a negative price';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END $$;
