-- Add per-item status to order_items
-- Items start as 'pending', kitchen marks each one 'preparing' then 'ready'
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (item_status IN ('pending', 'preparing', 'ready'));

-- Allow kitchen/staff to update item status
CREATE POLICY "order_items_update_staff"
  ON order_items FOR UPDATE
  USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'kitchen', 'waiter'));
