CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'cleaning');

CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 4 CHECK (capacity > 0),
  status table_status NOT NULL DEFAULT 'available',
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  deleted_by UUID
);

CREATE INDEX idx_tables_status ON restaurant_tables(status);

CREATE TRIGGER trg_restaurant_tables_audit
  BEFORE INSERT OR UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_fields();

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tables_select_all"
  ON restaurant_tables FOR SELECT
  USING (true);

CREATE POLICY "tables_insert_admin"
  ON restaurant_tables FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "tables_update_admin"
  ON restaurant_tables FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "tables_update_staff"
  ON restaurant_tables FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'cashier', 'waiter'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager', 'cashier', 'waiter'));

-- Link orders to tables (runs after both tables exist)
ALTER TABLE orders ADD COLUMN table_id UUID REFERENCES restaurant_tables(id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
