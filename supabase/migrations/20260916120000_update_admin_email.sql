DO $$
DECLARE
  target_user_id uuid;
  existing_admin_id uuid;
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE lower(email) = 'admin@triad.co.ke'
  LIMIT 1;

  SELECT id
  INTO existing_admin_id
  FROM auth.users
  WHERE lower(email) = 'admin@triadbrands.co.ke'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

  IF existing_admin_id IS NOT NULL AND existing_admin_id <> target_user_id THEN
    RETURN;
  END IF;

  UPDATE auth.users
  SET email = 'admin@triadbrands.co.ke',
      email_change = NULL,
      email_change_token_current = NULL,
      email_change_token_new = NULL,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = target_user_id;
END
$$;

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