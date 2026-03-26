import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

type Toast = (msg: string) => void;

type Subcategory = { slug: string; name: string };

type Category = {
  slug: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
  sortOrder: number;
};

const EMPTY: Category = { slug: '', name: '', icon: '', subcategories: [], sortOrder: 0 };

export function AdminCategories({ toast }: { toast: Toast }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [subSlug, setSubSlug] = useState('');
  const [subName, setSubName] = useState('');

  const load = async () => {
    const res = await apiFetch('/admin/categories');
    if (res.ok) setCategories(await res.json());
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing || !editing.slug.trim() || !editing.name.trim()) {
      toast('Slug and name are required');
      return;
    }
    setBusy(true);
    const res = await apiFetch('/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setBusy(false);
    if (res.ok) {
      toast('Category saved');
      setEditing(null);
      load();
    } else {
      const err = await res.json().catch(() => null);
      toast(err?.error ?? 'Failed to save');
    }
  };

  const remove = async (slug: string) => {
    if (!confirm(`Delete category "${slug}"?`)) return;
    setBusy(true);
    const res = await apiFetch(`/admin/categories/${slug}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) {
      toast('Category deleted');
      load();
    } else {
      toast('Failed to delete');
    }
  };

  const addSub = () => {
    if (!editing || !subSlug.trim() || !subName.trim()) return;
    setEditing({
      ...editing,
      subcategories: [...editing.subcategories, { slug: subSlug.trim(), name: subName.trim() }],
    });
    setSubSlug('');
    setSubName('');
  };

  const removeSub = (idx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      subcategories: editing.subcategories.filter((_, i) => i !== idx),
    });
  };

  // Edit/create form
  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="mb-4 text-sm text-teal-600 hover:underline">
          &larr; Back
        </button>
        <h2 className="text-lg font-bold text-gray-900">{editing.slug ? 'Edit Category' : 'New Category'}</h2>

        <div className="mt-4 max-w-lg space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">Slug</label>
            <input
              value={editing.slug}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="electronics"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Name</label>
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="Electronics"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Icon (emoji)</label>
            <input
              value={editing.icon}
              onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
              className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Sort Order</label>
            <input
              type="number"
              value={editing.sortOrder}
              onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
              className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Subcategories */}
          <div>
            <label className="block text-xs font-medium text-gray-600">Subcategories</label>
            {editing.subcategories.length > 0 && (
              <div className="mt-1 space-y-1">
                {editing.subcategories.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-sm">
                    <span className="text-gray-500">{s.slug}</span>
                    <span className="text-gray-700">{s.name}</span>
                    <button onClick={() => removeSub(i)} className="ml-auto text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <input
                placeholder="sub-slug"
                value={subSlug}
                onChange={(e) => setSubSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
              />
              <input
                placeholder="Sub Name"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="w-40 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
              />
              <button onClick={addSub} className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">
                Add
              </button>
            </div>
          </div>

          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Save Category
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Manage listing categories and subcategories</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="shrink-0 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + New Category
        </button>
      </div>

      {categories === null ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">No categories yet. Seed or create one.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {categories.map((cat) => (
            <div key={cat.slug} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{cat.icon || '📁'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{cat.slug}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {cat.subcategories.length} subcategories &middot; Order: {cat.sortOrder}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => { setEditing({ ...cat }); setSubSlug(''); setSubName(''); }}
                    className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(cat.slug)}
                    disabled={busy}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
