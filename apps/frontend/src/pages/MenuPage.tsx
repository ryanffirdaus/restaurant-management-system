import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Column } from "../components/Table";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Card from "../components/Card";
import Icon from "../components/Icon";
import SearchInput from "../components/SearchInput";
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

const CATEGORY_COLOR: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  // short keys (from select options)
  main: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  appetizer: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  drinks: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  dessert: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
  snacks: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
  other: {
    bg: "bg-surface-variant",
    text: "text-text-muted",
    border: "border-outline",
  },
  // full names (from seeder)
  "Main Courses": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  Appetizers: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Beverages: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  Desserts: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
  Pizza: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  Snacks: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
  },
};

function CategoryPill({ category }: { category: string | null }) {
  if (!category) return <span className="text-text-muted text-sm">—</span>;
  const c = CATEGORY_COLOR[category] ?? {
    bg: "bg-surface-variant",
    text: "text-text-muted",
    border: "border-outline",
  };
  const label = getCategoryLabel(category);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${c.bg} ${c.text} ${c.border}`}
    >
      {label}
    </span>
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
    if (res.ok) setItems(await res.json());
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
      setError(err.error ?? "Failed to create item");
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
      setError(err.error ?? "Failed to update item");
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
      className: "font-medium text-text-main whitespace-nowrap",
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-9 h-9 rounded-lg object-cover shrink-0 bg-surface-variant"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-surface-variant flex items-center justify-center shrink-0">
              <Icon
                name="ri-restaurant-2-line"
                className="text-base text-text-muted"
              />
            </div>
          )}
          <div>
            <p className="font-semibold text-text-main text-sm">{item.name}</p>
            {item.description && (
              <p className="text-xs text-text-muted truncate max-w-[220px]">
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
      className: "tabular-nums whitespace-nowrap font-semibold text-text-main",
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
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Icon name="ri-information-line" className="text-[18px]" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => openEdit(item)}
                title="Edit"
                className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Icon name="ri-pencil-line" className="text-[18px]" />
              </button>
              <button
                onClick={() => handleDelete(item)}
                title="Hapus"
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <Icon name="ri-delete-bin-6-line" className="text-[18px]" />
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
            <h1 className="text-2xl font-bold text-text-main tracking-tight">
              Menu
            </h1>
            <p className="text-sm text-text-muted mt-1">
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
          <span className="text-xs text-text-muted">
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
            {infoModal.image_url && (
              <img
                src={infoModal.image_url}
                alt={infoModal.name}
                className="w-full h-40 object-cover rounded-xl bg-surface-variant mb-4"
              />
            )}
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
                <span className="font-semibold text-primary">
                  {formatPrice(infoModal.price)}
                </span>
              }
            />
            <MenuInfoRow
              icon="toggle_on"
              label="Status"
              value={
                <Badge variant={infoModal.available ? "primary" : "neutral"}>
                  {infoModal.available ? "Available" : "Unavailable"}
                </Badge>
              }
            />
            <MenuInfoRow
              icon="calendar_today"
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
        <label className="block text-sm font-medium text-text-muted">
          Description{" "}
          <span className="text-text-muted text-xs opacity-60">(optional)</span>
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
        <label className="block text-sm font-medium text-text-muted mb-1.5">
          Category{" "}
          <span className="text-text-muted text-xs opacity-60">(optional)</span>
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
      <div className="flex items-center justify-between py-3 px-4 bg-surface-variant/40 rounded-xl border border-outline">
        <div>
          <p className="text-sm font-medium text-text-main">
            Available on Menu
          </p>
          <p className="text-xs text-text-muted mt-0.5">
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
        <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
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
    <div className="flex items-start gap-3 py-3 px-4 bg-surface-variant/30 rounded-xl border border-outline">
      <Icon name={icon} className="text-lg text-text-muted shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <div className="text-sm font-medium text-text-main">{value}</div>
      </div>
    </div>
  );
}
