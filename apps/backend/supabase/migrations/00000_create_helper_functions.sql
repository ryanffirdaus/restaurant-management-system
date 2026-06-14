CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::json ->> 'role', '') = 'admin';
$$;

CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = NOW();
    NEW.created_by = COALESCE(auth.uid(), NEW.created_by);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
    NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by);
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      NEW.deleted_by = COALESCE(auth.uid(), NEW.deleted_by);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
