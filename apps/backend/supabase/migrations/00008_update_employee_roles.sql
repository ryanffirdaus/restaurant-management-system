-- Align employee roles with flowchart: admin, waiter, kitchen, cashier
-- Migrate: chef → kitchen, remove manager, keep admin/cashier/waiter

-- Step 1: Create new enum type
CREATE TYPE employee_role_new AS ENUM ('admin', 'waiter', 'kitchen', 'cashier');

-- Step 2: Update employees table to use new enum
ALTER TABLE employees
  ALTER COLUMN role TYPE employee_role_new
  USING (
    CASE role::text
      WHEN 'chef' THEN 'kitchen'::employee_role_new
      WHEN 'manager' THEN 'waiter'::employee_role_new
      ELSE role::text::employee_role_new
    END
  );

-- Step 3: Drop old enum
DROP TYPE employee_role;

-- Step 4: Rename new enum to original name
ALTER TYPE employee_role_new RENAME TO employee_role;

-- Step 5: Update RLS policies that reference old role names
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
