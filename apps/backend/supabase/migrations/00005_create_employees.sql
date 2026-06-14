CREATE TYPE employee_role AS ENUM ('admin', 'manager', 'chef', 'cashier', 'waiter');

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role employee_role NOT NULL DEFAULT 'waiter',
  salary DECIMAL(10, 2),
  hire_date DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_active ON employees(active);

CREATE TRIGGER trg_employees_audit
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_fields();

CREATE OR REPLACE FUNCTION sync_employee_role_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data =
    raw_user_meta_data || jsonb_build_object('role', NEW.role::text)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_employee_role
  AFTER INSERT OR UPDATE OF role ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_role_to_metadata();

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_admin"
  ON employees FOR SELECT
  USING (is_admin());

CREATE POLICY "employees_select_own"
  ON employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "employees_insert_admin"
  ON employees FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "employees_update_admin"
  ON employees FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
