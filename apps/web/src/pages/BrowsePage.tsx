import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListingSearchHit } from '@marketplace/shared-types';
import { CATEGORIES, getCategoryBySlug } from '@marketplace/shared-utils';
import { PROVINCES } from '@marketplace/shared-utils';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { ListingCard } from '../components/ui/ListingCard';
import { ListingCardSkeleton } from '../components/ui/Skeleton';
import { Pagination, paginate } from '../components/ui/Pagination';
import { PageHead } from '../components/seo/PageHead';

export function BrowsePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hits, setHits] = useState<ListingSearchHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [page, setPage] = useState(1);

  // Filter state — initialized from URL
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') ?? '');
  const [province, setProvince] = useState(searchParams.get('province') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [condition, setCondition] = useState(searchParams.get('condition') ?? '');

  function buildQuery(): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (province) params.set('province', province);
    if (district) params.set('district', district);
    if (city) params.set('city', city);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (condition) params.set('condition', condition);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  async function fetchListings() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/search${buildQuery()}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Search failed');
      }
      setHits((await res.json()) as ListingSearchHit[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (province) params.set('province', province);
    if (district) params.set('district', district);
    if (city) params.set('city', city);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (condition) params.set('condition', condition);
    setSearchParams(params);
    setPage(1);
    void fetchListings();
  }

  function clearFilters() {
    setQ('');
    setCategory('');
    setSubcategory('');
    setProvince('');
    setDistrict('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setSearchParams({});
    setPage(1);
    setTimeout(() => void fetchListings(), 0);
  }

  const selectedCat = getCategoryBySlug(category);
  const selectedProv = PROVINCES.find((p) => p.slug === province);
  const selectedDist = selectedProv?.districts.find((d) => d.slug === district);

  const sortedHits = [...hits].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHead title="Browse Listings" description="Search and filter listings by category, location, and price." />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Listings</h1>
          {user && (
            <p className="mt-0.5 text-sm text-gray-500">
              Viewing as <span className="font-medium text-teal-600">{user.subscriptionPlan}</span> plan
            </p>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {hits.length} listing{hits.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-72">
          <form onSubmit={onFilter} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900">Filters</h2>

            {/* Text search */}
            <label className="block">
              <span className="text-sm text-gray-600">Search</span>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Keywords..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </label>

            {/* Category */}
            <label className="block">
              <span className="text-sm text-gray-600">Category</span>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                ))}
              </select>
            </label>

            {/* Subcategory */}
            {selectedCat && (
              <label className="block">
                <span className="text-sm text-gray-600">Subcategory</span>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Subcategories</option>
                  {selectedCat.subcategories.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}

            {/* Province */}
            <label className="block">
              <span className="text-sm text-gray-600">Province</span>
              <select
                value={province}
                onChange={(e) => { setProvince(e.target.value); setDistrict(''); setCity(''); }}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Provinces</option>
                {PROVINCES.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </label>

            {/* District */}
            {selectedProv && (
              <label className="block">
                <span className="text-sm text-gray-600">District</span>
                <select
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setCity(''); }}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Districts</option>
                  {selectedProv.districts.map((d) => (
                    <option key={d.slug} value={d.slug}>{d.name}</option>
                  ))}
                </select>
              </label>
            )}

            {/* City */}
            {selectedDist && (
              <label className="block">
                <span className="text-sm text-gray-600">City</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Cities</option>
                  {selectedDist.cities.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}

            {/* Condition */}
            <label className="block">
              <span className="text-sm text-gray-600">Condition</span>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Any Condition</option>
                <option value="new">Brand New</option>
                <option value="used">Used</option>
                <option value="reconditioned">Reconditioned</option>
              </select>
            </label>

            {/* Price range */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-gray-600">Min Price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600">Max Price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none"
                  placeholder="Any"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-1">
              {(['newest', 'price-asc', 'price-desc'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSortBy(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    sortBy === s
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {s === 'newest' ? 'Newest' : s === 'price-asc' ? 'Price: Low to High' : 'Price: High to Low'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : sortedHits.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-600">No listings found</p>
              <p className="mt-1 text-sm text-gray-400">Try adjusting your filters</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginate(sortedHits, page).map((hit) => (
                  <ListingCard
                    key={hit.listingId}
                    listingId={hit.listingId}
                    title={hit.title}
                    price={hit.price}
                    city={hit.city}
                    category={hit.category}
                    imageKeys={hit.imageKeys}
                    sellerName={hit.sellerName}
                    createdAt={hit.createdAt}
                    condition={hit.condition}
                    activePromotion={hit.activePromotion}
                  />
                ))}
              </div>
              <Pagination currentPage={page} totalItems={sortedHits.length} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
