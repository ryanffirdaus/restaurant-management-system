CREATE TYPE payment_method AS ENUM ('cash', 'debit_card', 'credit_card', 'qris', 'other');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  reference_id TEXT,
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_cashier_id ON payments(cashier_id);

CREATE TRIGGER trg_payments_audit
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_fields();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_staff"
  ON payments FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'cashier', 'waiter'));

CREATE POLICY "payments_insert_staff"
  ON payments FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager', 'cashier'));

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );
