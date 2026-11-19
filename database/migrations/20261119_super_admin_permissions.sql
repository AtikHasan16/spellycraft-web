BEGIN;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (SELECT auth.uid())
      AND lower(email) = 'akhasannaeem@gmail.com'
  );
$$;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
INSERT INTO public.profiles (id, name, email, role)
SELECT id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  email, 'admin'
FROM auth.users WHERE lower(email) = 'akhasannaeem@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
    AND COALESCE((SELECT auth.role()), '') <> 'service_role'
    AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the platform super admin may change access roles'
      USING ERRCODE = '42501';
  END IF;
  IF public.is_super_admin() AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = OLD.id AND lower(email) = 'akhasannaeem@gmail.com'
  )
    AND NEW.role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'The platform super admin role cannot be removed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

CREATE OR REPLACE FUNCTION public.admin_update_profile_role(
  p_target_user_id UUID,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_updated_profile public.profiles%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the platform super admin may change user roles'
      USING ERRCODE = '42501';
  END IF;
  IF p_target_user_id IS NULL OR p_role IS NULL OR p_role NOT IN ('general', 'admin') THEN
    RAISE EXCEPTION 'A target user ID and valid role are required'
      USING ERRCODE = '22023';
  END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_target_user_id
  RETURNING * INTO v_updated_profile;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The target profile does not exist' USING ERRCODE = 'P0002';
  END IF;
  RETURN jsonb_build_object('id', v_updated_profile.id, 'name', v_updated_profile.name,
    'email', v_updated_profile.email, 'role', v_updated_profile.role);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_profile_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_role(UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Admins delete vocabulary" ON public.vocabularies;
CREATE POLICY "Super admins delete vocabulary" ON public.vocabularies
  FOR DELETE TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS "Admins delete grammar questions" ON public.grammar_questions;
CREATE POLICY "Super admins delete grammar questions" ON public.grammar_questions
  FOR DELETE TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS "Admins delete audit logs" ON public.audit_logs;
CREATE POLICY "Super admins delete audit logs" ON public.audit_logs
  FOR DELETE TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS "Admins delete public resources" ON public.public_resources;
CREATE POLICY "Super admins delete public resources" ON public.public_resources
  FOR DELETE TO authenticated USING (public.is_super_admin());
DROP POLICY IF EXISTS "Admins delete private resources" ON public.private_resources;
CREATE POLICY "Super admins delete private resources" ON public.private_resources
  FOR DELETE TO authenticated USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.clear_ai_usage_errors()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the platform super admin may clear AI error logs'
      USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.ai_usage_logs WHERE status = 'error';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
