import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api-client';
import { useToast } from '../components/ui/Toast';
import { CategoryPicker } from '../components/ui/CategoryPicker';
import { LocationPicker } from '../components/ui/LocationPicker';
import { PageHead } from '../components/seo/PageHead';

export function NewListingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('0');
  const [condition, setCondition] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch('/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          subcategory: subcategory || undefined,
          city,
          district: district || undefined,
          province: province || undefined,
          price: Number(price),
          negotiable,
          condition: condition || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { listingId?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Create failed');
      if (data.listingId) {
        toast('Ad created! Add photos and submit for review.', 'success');
        navigate(`/listings/${data.listingId}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHead title="Post New Ad" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Post New Ad</h1>
        <Link to="/listings" className="text-sm text-gray-500 hover:text-gray-700">&larr; My Ads</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="e.g. iPhone 15 Pro Max 256GB"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
            placeholder="Describe your item - condition, features, reason for selling..."
          />
        </label>

        {/* Category picker */}
        <CategoryPicker
          category={category}
          subcategory={subcategory}
          onCategoryChange={setCategory}
          onSubcategoryChange={setSubcategory}
        />

        {/* Location picker */}
        <LocationPicker
          province={province}
          district={district}
          city={city}
          onProvinceChange={setProvince}
          onDistrictChange={setDistrict}
          onCityChange={setCity}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Price (Rs)</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Condition</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Not specified</option>
              <option value="new">Brand New</option>
              <option value="used">Used</option>
              <option value="reconditioned">Reconditioned</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={negotiable}
            onChange={(e) => setNegotiable(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-gray-700">Price is negotiable</span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-teal-600 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {busy ? 'Creating...' : 'Create Draft Ad'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your ad will be saved as a draft. Add photos, then submit for review.
        </p>
      </form>
    </div>
  );
}
