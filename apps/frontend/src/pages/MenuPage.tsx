import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Column } from "../components/Table";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Card from "../components/Card";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import {
  Button,
  TextInput,
  Textarea,
  Select,
  Toggle,
  SearchBar,
} from "../components/ui";
import type { LayoutContext } from "../App";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  available: boolean;
  image_url: string | null;
  created_at: string;
}

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
  image_url: string;
}

const emptyForm: MenuFormData = {
  name: "",
  description: "",
  price: "",
  category: "",
  available: true,
  image_url: "",
};

const categories = [
  { value: "main", label: "Main Course" },
  { value: "appetizer", label: "Appetizer" },
  { value: "drinks", label: "Drinks" },
  { value: "dessert", label: "Dessert" },
  { value: "snacks", label: "Snacks" },
  { value: "other", label: "Other" },
];

const categoryFilterOptions = [
  { value: "all", label: "All Categories" },
  ...categories,
];

const availabilityOptions = [
  { value: "all", label: "All Items" },
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
];

// Categories are not statuses: keep chips neutral and tell them apart by icon,
// so status colours stay meaningful.
const CATEGORY_ICON: Record<string, string> = {
  // short keys (from select options)
  main: "ri-restaurant-2-line",
  appetizer: "ri-bowl-line",
  drinks: "ri-cup-line",
  dessert: "ri-cake-3-line",
  snacks: "ri-cookie-line",
  other: "ri-price-tag-3-line",
  // full names (from seeder)
  "Main Courses": "ri-restaurant-2-line",
  Appetizers: "ri-bowl-line",
  Beverages: "ri-cup-line",
  Desserts: "ri-cake-3-line",
  Pizza: "ri-pie-chart-line",
  Snacks: "ri-cookie-line",
};

function getCategoryIcon(category: string | null) {
  return (category && CATEGORY_ICON[category]) || "ri-restaurant-2-line";
}

function CategoryPill({ category }: { category: string | null }) {
  if (!category) return <span className="text-ink-3 text-sm">—</span>;
  const label = getCategoryLabel(category);
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-line bg-raised text-xs font-medium text-ink-2">
      <Icon name={getCategoryIcon(category)} className="text-sm text-ink-3" />
      {label}
    </span>
  );
}

function MenuImage({
  item,
  className = "",
  iconClass = "text-3xl",
}: {
  item: MenuItem;
  className?: string;
  iconClass?: string;
}) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        loading="lazy"
        className={`aspect-[4/3] object-cover rounded-lg bg-raised ${className}`}
      />
    );
  }
  return (
    <div
      className={`aspect-[4/3] rounded-lg bg-raised flex items-center justify-center ${className}`}
    >
      <Icon name={getCategoryIcon(item.category)} className={`${iconClass} text-ink-3`} />
    </div>
  );
}

type SortKey = "name" | "category" | "price" | "available";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCategoryLabel(value: string | null) {
  return categories.find((c) => c.value === value)?.label ?? value ?? "—";
}

export default function MenuPage() {
  useOutletContext<LayoutContext>();
  const { employeeRole } = useAuth();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<MenuItem | null>(null);
  const [infoModal, setInfoModal] = useState<MenuItem | null>(null);

  const [form, setForm] = useState<MenuFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const isAdmin = employeeRole === "admin" || employeeRole === "manager";

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortDir("asc");
    }
  }

  async function fetchItems() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/menu`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const body = await res.json();
      setItems(body.data ?? body);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = items.filter((item) => {
      if (availFilter === "available" && !item.available) return false;
      if (availFilter === "unavailable" && item.available) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      if (q) {
        const name = item.name.toLowerCase();
        const cat = (item.category ?? "").toLowerCase();
        const desc = (item.description ?? "").toLowerCase();
        if (!name.includes(q) && !cat.includes(q) && !desc.includes(q))
          return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "category":
          cmp = (a.category ?? "").localeCompare(b.category ?? "");
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "available":
          cmp = Number(a.available) - Number(b.available);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [items, search, categoryFilter, availFilter, sortKey, sortDir]);

  function openAdd() {
    setForm(emptyForm);
    setError(null);
    setAddModal(true);
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category ?? "",
      available: item.available,
      image_url: item.image_url ?? "",
    });
    setError(null);
    setEditModal(item);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.price || Number(form.price) < 0) {
      setError("Price must be a valid positive number");
      return;
    }
    setError(null);
    setSubmitting(true);

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        category: form.category || undefined,
        available: form.available,
        image_url: form.image_url || undefined,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.message ?? "Failed to create item");
      return;
    }

    setAddModal(false);
    fetchItems();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    if (form.price !== "" && Number(form.price) < 0) {
      setError("Price must be a valid positive number");
      return;
    }
    setError(null);
    setSubmitting(true);

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/menu/${editModal.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price),
          category: form.category || undefined,
          available: form.available,
          image_url: form.image_url || undefined,
        }),
      },
    );

    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json();
      setError(err.message ?? "Failed to update item");
      return;
    }

    setEditModal(null);
    fetchItems();
  }

  async function handleDelete(item: MenuItem) {
    if (
      !confirm(
        `Hapus "${item.name}" dari menu? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`${import.meta.env.VITE_API_URL}/menu/${item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  }

  async function toggleAvailability(item: MenuItem) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(
      `${import.meta.env.VITE_API_URL}/menu/${item.id}/availability`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    fetchItems();
  }

  const columns: Column<MenuItem>[] = [
    {
      key: "name",
      label: "Item",
      sortable: true,
      className: "font-normal text-ink whitespace-nowrap",
      render: (item) => (
        <div className="flex items-center gap-3">
          <MenuImage item={item} className="w-14 shrink-0" iconClass="text-lg" />
          <div>
            <p className="font-medium text-ink text-sm">{item.name}</p>
            {item.description && (
              <p className="text-xs text-ink-3 truncate max-w-[220px]">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      className: "whitespace-nowrap",
      render: (item) => <CategoryPill category={item.category} />,
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      className: "num whitespace-nowrap font-semibold text-ink",
      render: (item) => formatPrice(item.price),
    },
    {
      key: "available",
      label: "Status",
      sortable: true,
      className: "whitespace-nowrap",
      render: (item) => (
        <button
          onClick={() => isAdmin && toggleAvailability(item)}
          title={isAdmin ? "Toggle availability" : undefined}
          className={isAdmin ? "cursor-pointer" : "cursor-default"}
        >
          <Badge variant={item.available ? "primary" : "neutral"}>
            {item.available ? "Available" : "Unavailable"}
          </Badge>
        </button>
      ),
    },
    {
      key: "actions" as never,
      label: "",
      className: "whitespace-nowrap",
      render: (item) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setInfoModal(item)}
            title="Detail"
            className="p-1.5 rounded text-ink-2 hover:text-ink hover:bg-raised transition-colors"
          >
            <Icon name="ri-information-line" className="text-lg" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => openEdit(item)}
                title="Edit"
                className="p-1.5 rounded text-ink-2 hover:text-ink hover:bg-raised transition-colors"
              >
                <Icon name="ri-pencil-line" className="text-lg" />
              </button>
              <button
                onClick={() => handleDelete(item)}
                title="Hapus"
                className="p-1.5 rounded text-ink-2 hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <Icon name="ri-delete-bin-6-line" className="text-lg" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const modalFooter = (formId: string, label: string) => (
    <>
      <Button
        variant="secondary"
        type="button"
        onClick={() => {
          setAddModal(false);
          setEditModal(null);
          setError(null);
        }}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        form={formId}
        disabled={submitting}
      >
        {submitting ? "Saving..." : label}
      </Button>
    </>
  );

  return (
    <div>
      <div className="h-16" />
      <div className="p-container-margin space-y-gutter">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Menu
            </h1>
            <p className="text-sm text-ink-2 mt-1">
              Manage restaurant menu items
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="primary"
              icon={<Icon name="ri-add-line" className="text-base" />}
              onClick={openAdd}
            >
              Add Item
            </Button>
          )}
        </header>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or description..."
            className="flex-1 min-w-[200px] max-w-xs"
          />
          <div className="w-48">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryFilterOptions}
              placeholder="All Categories"
            />
          </div>
          <div className="w-40">
            <Select
              value={availFilter}
              onChange={setAvailFilter}
              options={availabilityOptions}
              placeholder="All Items"
            />
          </div>
          <span className="text-xs text-ink-3 num">
            {filtered.length} of {items.length}
          </span>
        </div>

        <Card padding={false}>
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            emptyText="No menu items match your filters."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </Card>
      </div>

      {/* Add Modal */}
      <Modal
        open={addModal}
        onClose={() => {
          setAddModal(false);
          setError(null);
        }}
        title="Add Menu Item"
        subtitle="Create a new item for the menu"
        footer={modalFooter("menu-add-form", "Create Item")}
      >
        <MenuForm
          id="menu-add-form"
          form={form}
          setForm={setForm}
          onSubmit={handleAdd}
          error={error}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editModal}
        onClose={() => {
          setEditModal(null);
          setError(null);
        }}
        title="Edit Menu Item"
        subtitle={editModal?.name}
        footer={modalFooter("menu-edit-form", "Save Changes")}
      >
        <MenuForm
          id="menu-edit-form"
          form={form}
          setForm={setForm}
          onSubmit={handleEdit}
          error={error}
        />
      </Modal>

      {/* Info Modal */}
      <Modal
        open={!!infoModal}
        onClose={() => setInfoModal(null)}
        title="Menu Item Detail"
        subtitle={infoModal?.name}
        footer={
          <Button variant="secondary" onClick={() => setInfoModal(null)}>
            Close
          </Button>
        }
      >
        {infoModal && (
          <div className="space-y-3">
            <MenuImage item={infoModal} className="w-full mb-4" iconClass="text-5xl" />
            <MenuInfoRow
              icon="ri-restaurant-2-line"
              label="Name"
              value={infoModal.name}
            />
            <MenuInfoRow
              icon="ri-file-text-line"
              label="Description"
              value={infoModal.description ?? "—"}
            />
            <MenuInfoRow
              icon="ri-price-tag-3-line"
              label="Category"
              value={<CategoryPill category={infoModal.category} />}
            />
            <MenuInfoRow
              icon="ri-money-dollar-circle-line"
              label="Price"
              value={
                <span className="num font-semibold text-ink">
                  {formatPrice(infoModal.price)}
                </span>
              }
            />
            <MenuInfoRow
              icon="ri-toggle-line"
              label="Status"
              value={
                <Badge variant={infoModal.available ? "primary" : "neutral"}>
                  {infoModal.available ? "Available" : "Unavailable"}
                </Badge>
              }
            />
            <MenuInfoRow
              icon="ri-calendar-line"
              label="Added"
              value={new Date(infoModal.created_at).toLocaleDateString(
                "id-ID",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function MenuForm({
  id,
  form,
  setForm,
  onSubmit,
  error,
}: {
  id: string;
  form: MenuFormData;
  setForm: React.Dispatch<React.SetStateAction<MenuFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
}) {
  return (
    <form id={id} onSubmit={onSubmit} className="space-y-4">
      <TextInput
        label="Item Name"
        placeholder="e.g. Nasi Goreng Spesial"
        required
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-normal text-ink-2">
          Description{" "}
          <span className="text-ink-3 text-xs">(optional)</span>
        </label>
        <Textarea
          placeholder="Short description of the item..."
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>
      <TextInput
        label="Price"
        type="number"
        placeholder="e.g. 35000"
        hint="Rp"
        required
        min={0}
        value={form.price}
        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
      />
      <div>
        <label className="block text-sm font-normal text-ink-2 mb-1.5">
          Category{" "}
          <span className="text-ink-3 text-xs">(optional)</span>
        </label>
        <Select
          value={form.category}
          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          options={categories}
          placeholder="Select category"
        />
      </div>
      <TextInput
        label="Image URL"
        type="url"
        placeholder="https://..."
        hint="optional"
        value={form.image_url}
        onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
      />
      <div className="flex items-center justify-between py-3 px-4 bg-raised rounded-xl border border-line">
        <div>
          <p className="text-sm font-medium text-ink">
            Available on Menu
          </p>
          <p className="text-xs text-ink-3 mt-0.5">
            {form.available
              ? "Visible and orderable by customers"
              : "Hidden from menu"}
          </p>
        </div>
        <Toggle
          checked={form.available}
          onChange={(e) =>
            setForm((f) => ({ ...f, available: e.target.checked }))
          }
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/40 rounded-xl px-4 py-3">
          <Icon name="ri-error-warning-line" className="text-base shrink-0" />
          {error}
        </div>
      )}
    </form>
  );
}

function MenuInfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 bg-raised rounded-xl border border-line">
      <Icon name={icon} className="text-lg text-ink-3 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-3 mb-0.5">{label}</p>
        <div className="text-sm font-normal text-ink">{value}</div>
      </div>
    </div>
  );
}
