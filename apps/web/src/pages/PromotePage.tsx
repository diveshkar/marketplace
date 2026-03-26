import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Listing, PromotionPlan, Promotion } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { getStripe } from '../lib/stripe';
import { useToast } from '../components/ui/Toast';
import { PaymentModal } from '../components/ui/PaymentModal';
import { PageHead } from '../components/seo/PageHead';

export function PromotePage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedListing = searchParams.get('listing');

  const [listings, setListings] = useState<Listing[] | null>(null);
  const [plans, setPlans] = useState<PromotionPlan[] | null>(null);
  const [myPromos, setMyPromos] = useState<Promotion[] | null>(null);

  const [selectedListing, setSelectedListing] = useState<string>(preselectedListing ?? '');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [success, setSuccess] = useState<{ paymentId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [listingsRes, plansRes, promosRes] = await Promise.all([
          apiFetch('/listings/mine'),
          apiFetch('/promotions/plans'),
          apiFetch('/me/promotions'),
        ]);
        if (cancelled) return;
        if (listingsRes.ok) {
          const data = (await listingsRes.json()) as Listing[];
          setListings(data.filter((l) => l.status === 'ACTIVE'));
        }
        if (plansRes.ok) setPlans((await plansRes.json()) as PromotionPlan[]);
        if (promosRes.ok) setMyPromos((await promosRes.json()) as Promotion[]);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handlePayClick() {
    if (!selectedListing || !selectedPlan) {
      toast('Select a listing and a promotion plan', 'error');
      return;
    }
    setInitiating(true);
    try {
      const res = await apiFetch('/promotions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedListing, type: selectedPlan }),
      });
      const data = (await res.json()) as { clientSecret?: string; paymentId?: string; error?: string };
      if (!res.ok) {
        toast(data.error || 'Failed to initiate payment', 'error');
        return;
      }
      setClientSecret(data.clientSecret!);
      setShowPayment(true);
    } catch {
      toast('Network error', 'error');
    } finally {
      setInitiating(false);
    }
  }

  async function handlePaymentSuccess(stripePaymentIntentId: string) {
    setShowPayment(false);
    setClientSecret(null);
    setSuccess({ paymentId: stripePaymentIntentId });
    toast('Promotion purchased!', 'success');
    // Refresh promos
    try {
      const promosRes = await apiFetch('/me/promotions');
      if (promosRes.ok) setMyPromos((await promosRes.json()) as Promotion[]);
    } catch {
      // ignore
    }
  }

  function handlePaymentError(message: string) {
    toast(message, 'error');
  }

  function handleClose() {
    setShowPayment(false);
    setClientSecret(null);
  }

  const selectedPlanInfo = plans?.find((p) => p.type === selectedPlan);
  const selectedListingInfo = listings?.find((l) => l.listingId === selectedListing);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="Promote Listing" />
      <h1 className="text-2xl font-bold text-gray-900">Promote Your Listing</h1>
      <p className="mt-1 text-sm text-gray-500">Boost visibility and get more views with paid promotions</p>

      {/* Step 1: Select listing */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800">1. Select a Listing</h2>
        {listings === null ? (
          <div className="mt-3 h-12 animate-pulse rounded-lg bg-gray-200" />
        ) : listings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            You have no active listings.{' '}
            <Link to="/listings/new" className="text-teal-600 hover:underline">Create one</Link> first.
          </p>
        ) : (
          <select
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">-- Choose a listing --</option>
            {listings.map((l) => (
              <option key={l.listingId} value={l.listingId}>
                {l.title} — Rs {l.price.toLocaleString()}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* Step 2: Select plan */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800">2. Choose a Promotion Plan</h2>
        {plans === null ? (
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {plans.map((p) => {
              const isSelected = selectedPlan === p.type;
              const colors: Record<string, string> = {
                BUMP: 'border-blue-400 bg-blue-50',
                FEATURED: 'border-amber-400 bg-amber-50',
                TOP_AD: 'border-purple-400 bg-purple-50',
              };
              const badges: Record<string, string> = {
                BUMP: 'bg-blue-100 text-blue-700',
                FEATURED: 'bg-amber-100 text-amber-700',
                TOP_AD: 'bg-purple-100 text-purple-700',
              };

              return (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => setSelectedPlan(p.type)}
                  className={`rounded-xl border-2 p-5 text-left transition ${
                    isSelected ? colors[p.type] : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badges[p.type]}`}>
                    {p.label}
                  </span>
                  <p className="mt-3 text-2xl font-bold text-gray-900">
                    Rs {p.priceRs.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {p.durationDays === 1 ? 'Instant' : `${p.durationDays} days`}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{p.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 3: Confirm & Pay */}
      {selectedPlanInfo && selectedListingInfo && (
        <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold text-gray-800">3. Confirm & Pay</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Listing:</span> {selectedListingInfo.title}</p>
            <p><span className="font-medium">Plan:</span> {selectedPlanInfo.label}</p>
            <p><span className="font-medium">Amount:</span> Rs {selectedPlanInfo.priceRs.toLocaleString()}</p>
            <p><span className="font-medium">Duration:</span> {selectedPlanInfo.durationDays === 1 ? 'Instant boost' : `${selectedPlanInfo.durationDays} days`}</p>
          </div>
          <button
            type="button"
            disabled={initiating}
            onClick={handlePayClick}
            className="mt-4 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {initiating ? 'Preparing payment...' : `Proceed to Payment — Rs ${selectedPlanInfo.priceRs.toLocaleString()}`}
          </button>
        </section>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment && !!clientSecret}
        onClose={handleClose}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        amountRs={selectedPlanInfo?.priceRs ?? 0}
        description={selectedPlanInfo && selectedListingInfo ? `${selectedPlanInfo.label} for "${selectedListingInfo.title}"` : ''}
        clientSecret={clientSecret}
        stripePromise={getStripe()}
      />

      {/* Success */}
      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          <p className="font-semibold">Payment successful!</p>
          <p className="mt-1">Your promotion is now active.</p>
          <Link to="/me/billing" className="mt-2 inline-block text-teal-600 hover:underline">
            View billing history
          </Link>
        </div>
      )}

      {/* My Promotions */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800">My Promotions</h2>
        {myPromos === null ? (
          <div className="mt-3 h-24 animate-pulse rounded-lg bg-gray-200" />
        ) : myPromos.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">You have no promotions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Listing</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Expires</th>
                  <th className="pb-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {myPromos.map((p) => {
                  const listing = listings?.find((l) => l.listingId === p.listingId);
                  const expired = new Date(p.expiresAt) < new Date();
                  return (
                    <tr key={p.promotionId} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.type === 'BUMP' ? 'bg-blue-100 text-blue-700'
                            : p.type === 'FEATURED' ? 'bg-amber-100 text-amber-700'
                              : 'bg-purple-100 text-purple-700'
                        }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-700">
                        {listing ? listing.title : p.listingId.slice(0, 8) + '...'}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={expired ? 'text-gray-400' : 'text-green-600 font-medium'}>
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(p.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-gray-700">Rs {p.priceRs.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
