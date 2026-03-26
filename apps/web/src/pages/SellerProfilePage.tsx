import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ListingSearchHit, SellerProfile } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { ListingCard } from '../components/ui/ListingCard';
import { PageHead } from '../components/seo/PageHead';

export function SellerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<ListingSearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/sellers/${userId}`);
        if (!res.ok) {
          if (!cancelled) setError('Seller not found');
          return;
        }
        const data = (await res.json()) as { profile: SellerProfile; listings: ListingSearchHit[] };
        if (cancelled) return;
        setProfile(data.profile);
        setListings(data.listings);
      } catch {
        if (!cancelled) setError('Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!userId) return <p className="p-8 text-red-600">Invalid seller ID</p>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHead title="Seller Profile" />
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-teal-600">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Seller Profile</span>
      </nav>

      {loading && (
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-32 rounded-xl bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center py-16">
          <p className="text-lg font-medium text-red-600">{error}</p>
          <Link to="/browse" className="mt-4 text-sm text-teal-600 hover:underline">Back to Browse</Link>
        </div>
      )}

      {profile && (
        <>
          {/* Seller card */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-700">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-sm text-gray-500">
                  Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {profile.totalActiveListings} active {profile.totalActiveListings === 1 ? 'listing' : 'listings'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Listings */}
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Listings by {profile.name}
          </h2>

          {listings.length === 0 ? (
            <p className="text-sm text-gray-500">This seller has no active listings.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {listings.map((l) => (
                <ListingCard
                  key={l.listingId}
                  listingId={l.listingId}
                  title={l.title}
                  price={l.price}
                  city={l.city}
                  category={l.category}
                  imageKeys={l.imageKeys}
                  condition={l.condition}
                  createdAt={l.createdAt}
                  negotiable={l.negotiable}
                  activePromotion={l.activePromotion}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
