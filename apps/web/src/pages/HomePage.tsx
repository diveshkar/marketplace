import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ListingSearchHit } from '@marketplace/shared-types';
import { CATEGORIES } from '@marketplace/shared-utils';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { ListingCard } from '../components/ui/ListingCard';
import { ListingCardSkeleton } from '../components/ui/Skeleton';
import { PageHead } from '../components/seo/PageHead';

export function HomePage() {
  const { token } = useAuth();
  const [recentListings, setRecentListings] = useState<ListingSearchHit[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/search');
        if (res.ok && !cancelled) {
          const data = (await res.json()) as ListingSearchHit[];
          setRecentListings(data.slice(0, 8));
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <PageHead description="Buy and sell anything locally. Browse thousands of listings near you." />
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-16 text-center text-white">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Buy & Sell Anything
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-teal-100">
          Find great deals in your area. Post your ad for free and connect with buyers instantly.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/browse"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-teal-700 shadow hover:bg-teal-50"
          >
            Browse Ads
          </Link>
          {token ? (
            <Link
              to="/listings/new"
              className="rounded-lg border-2 border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Post Your Ad
            </Link>
          ) : (
            <Link
              to="/register"
              className="rounded-lg border-2 border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-xl font-bold text-gray-900">Browse by Category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/browse?category=${encodeURIComponent(cat.slug)}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat.subcategories.length} subcategories</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Listings</h2>
          <Link to="/browse" className="text-sm font-medium text-teal-600 hover:text-teal-700">
            View all &rarr;
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentListings === null ? (
            Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
          ) : recentListings.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">
              No listings yet. Be the first to{' '}
              <Link to="/listings/new" className="text-teal-600 hover:underline">post an ad</Link>!
            </p>
          ) : (
            recentListings.map((hit) => (
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
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      {!token && (
        <section className="bg-gray-100 px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to sell something?</h2>
          <p className="mt-2 text-gray-600">
            Join thousands of sellers. It&apos;s quick and free to get started.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-lg bg-teal-600 px-8 py-3 font-medium text-white hover:bg-teal-700"
          >
            Create Free Account
          </Link>
        </section>
      )}
    </div>
  );
}
