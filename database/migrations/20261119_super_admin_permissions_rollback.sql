BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
    AND COALESCE((SELECT auth.role()), '') <> 'service_role'
    AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_profile_role(p_target_user_id UUID, p_role TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_name TEXT;
  v_updated_profile public.profiles%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators may change user roles' USING ERRCODE = '42501';
  END IF;
  IF p_target_user_id IS NULL OR p_role IS NULL OR p_role NOT IN ('general', 'admin') THEN
    RAISE EXCEPTION 'A target user ID and a valid role are required' USING ERRCODE = '22023';
  END IF;
  SELECT COALESCE(name, email, 'Administrator') INTO v_actor_name
    FROM public.profiles WHERE id = v_actor_id;
  UPDATE public.profiles SET role = p_role WHERE id = p_target_user_id
    RETURNING * INTO v_updated_profile;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The target candidate profile does not exist' USING ERRCODE = 'P0002';
  END IF;
  BEGIN
    INSERT INTO public.audit_logs(user_id, target_user_id, user_name, action, details)
    VALUES(v_actor_id, p_target_user_id, COALESCE(v_actor_name, 'Administrator'),
      'ROLE_CHANGE', FORMAT('Role updated to [%s] by administrator', UPPER(p_role)));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to record audit log: %', SQLERRM;
  END;
  RETURN JSONB_BUILD_OBJECT('id', v_updated_profile.id, 'name', v_updated_profile.name,
    'email', v_updated_profile.email, 'role', v_updated_profile.role);
END;
$$;

DROP POLICY IF EXISTS "Super admins delete vocabulary" ON public.vocabularies;
CREATE POLICY "Admins delete vocabulary" ON public.vocabularies
  FOR DELETE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Super admins delete grammar questions" ON public.grammar_questions;
CREATE POLICY "Admins delete grammar questions" ON public.grammar_questions
  FOR DELETE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Super admins delete audit logs" ON public.audit_logs;
CREATE POLICY "Admins delete audit logs" ON public.audit_logs
  FOR DELETE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Super admins delete public resources" ON public.public_resources;
CREATE POLICY "Admins delete public resources" ON public.public_resources
  FOR DELETE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Super admins delete private resources" ON public.private_resources;
CREATE POLICY "Admins delete private resources" ON public.private_resources
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.clear_ai_usage_errors()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE v_deleted_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access is required' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.ai_usage_logs WHERE status = 'error';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

DROP FUNCTION public.is_super_admin();
NOTIFY pgrst, 'reload schema';
COMMIT;
