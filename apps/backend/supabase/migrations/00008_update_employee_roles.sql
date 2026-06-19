-- Align employee roles with flowchart: admin, waiter, kitchen, cashier
-- Migrate: chef → kitchen, remove manager, keep admin/cashier/waiter

-- Step 1: Create new enum type
CREATE TYPE employee_role_new AS ENUM ('admin', 'waiter', 'kitchen', 'cashier');

-- Step 2: Drop default before altering type (cannot auto-cast default)
ALTER TABLE employees
  ALTER COLUMN role DROP DEFAULT;

-- Step 3: Drop trigger that depends on the column (blocks type change)
DROP TRIGGER IF EXISTS trg_sync_employee_role ON employees;

-- Step 4: Update employees table to use new enum
ALTER TABLE employees
  ALTER COLUMN role TYPE employee_role_new
  USING (
    CASE role::text
      WHEN 'chef' THEN 'kitchen'::employee_role_new
      WHEN 'manager' THEN 'waiter'::employee_role_new
      ELSE role::text::employee_role_new
    END
  );

-- Step 5: Re-add default with new type
ALTER TABLE employees
  ALTER COLUMN role SET DEFAULT 'waiter';

-- Step 6: Recreate trigger that depends on the column
CREATE TRIGGER trg_sync_employee_role
  AFTER INSERT OR UPDATE OF role ON employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_role_to_metadata();

-- Step 7: Drop old enum
DROP TYPE employee_role;

-- Step 8: Rename new enum to original name
ALTER TYPE employee_role_new RENAME TO employee_role;

-- Step 9: Update RLS policies that reference old role names
DROP POLICY IF EXISTS "orders_select_staff" ON orders;
CREATE POLICY "orders_select_staff"
  ON orders FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'));

DROP POLICY IF EXISTS "orders_update_staff" ON orders;
CREATE POLICY "orders_update_staff"
  ON orders FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'));

DROP POLICY IF EXISTS "order_items_select_staff" ON order_items;
CREATE POLICY "order_items_select_staff"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'));

DROP POLICY IF EXISTS "tables_update_staff" ON restaurant_tables;
CREATE POLICY "tables_update_staff"
  ON restaurant_tables FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'));

DROP POLICY IF EXISTS "payments_select_staff" ON payments;
CREATE POLICY "payments_select_staff"
  ON payments FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'cashier', 'waiter', 'kitchen'));

DROP POLICY IF EXISTS "payments_insert_staff" ON payments;
CREATE POLICY "payments_insert_staff"
  ON payments FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'cashier'));
