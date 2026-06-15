CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT,
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);

CREATE TRIGGER trg_menu_items_audit
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_fields();

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items_select_all"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "menu_items_insert_admin"
  ON menu_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "menu_items_update_admin"
  ON menu_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
