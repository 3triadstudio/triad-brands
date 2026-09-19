DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE lower(email) = 'admin@triadbrands.co.ke'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'admin@triadbrands.co.ke does not exist yet; no role assigned';
    RETURN;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  INSERT INTO public.user_roles (user_id, role, permissions)
  VALUES (
    target_user_id,
    'admin',
    '["dashboard","content","catalog","leads","projects","settings","users"]'::jsonb
  );
END
$$;