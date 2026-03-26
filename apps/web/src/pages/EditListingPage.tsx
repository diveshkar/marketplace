import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Listing } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { useToast } from '../components/ui/Toast';
import { CategoryPicker } from '../components/ui/CategoryPicker';
import { LocationPicker } from '../components/ui/LocationPicker';
import { PageHead } from '../components/seo/PageHead';

export function EditListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/listings/${listingId}`);
        if (!res.ok) {
          if (!cancelled) setError('Listing not found');
          return;
        }
        const data = (await res.json()) as { listing: Listing };
        if (cancelled) return;
        const l = data.listing;
        setListing(l);
        setTitle(l.title);
        setDescription(l.description);
        setCategory(l.category);
        setSubcategory(l.subcategory ?? '');
        setProvince(l.province ?? '');
        setDistrict(l.district ?? '');
        setCity(l.city);
        setPrice(String(l.price));
        setCondition(l.condition ?? '');
        setNegotiable(l.negotiable ?? false);
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [listingId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId) return;
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}`, {
        method: 'PATCH',
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast('Listing updated!', 'success');
      navigate(`/listings/${listingId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  if (!listingId) return <p className="p-8 text-red-600">Invalid listing ID</p>;

  const editable = listing && (listing.status === 'DRAFT' || listing.status === 'PENDING');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHead title="Edit Listing" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
        <Link to={`/listings/${listingId}`} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to listing
        </Link>
      </div>

      {loading && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      )}

      {error && !listing && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {listing && !editable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          This listing is <strong>{listing.status}</strong> and cannot be edited.
          Only DRAFT and PENDING listings can be modified.
        </div>
      )}

      {listing && editable && (
        <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
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
            />
          </label>

          <CategoryPicker
            category={category}
            subcategory={subcategory}
            onCategoryChange={setCategory}
            onSubcategoryChange={setSubcategory}
          />

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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              to={`/listings/${listingId}`}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
