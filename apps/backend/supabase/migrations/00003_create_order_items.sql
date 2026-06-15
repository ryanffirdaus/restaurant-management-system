CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TRIGGER trg_order_items_audit
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_fields();

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_staff"
  ON order_items FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'cashier', 'waiter'));

CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
