import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { getStripe } from '../lib/stripe';
import { useToast } from '../components/ui/Toast';
import { PaymentModal } from '../components/ui/PaymentModal';
import type { SubscriptionUpgradePlan } from '@marketplace/shared-types';
import { PageHead } from '../components/seo/PageHead';

type PlanInfo = {
  plan: string;
  label: string;
  maxListings: number;
  maxImagesPerListing: number;
  dailyInquiries: number;
  favorites: boolean;
  sellerPhoneReveal: boolean;
  sellerEmailReveal: boolean;
  featuredListings: boolean;
  bumpListing: boolean;
};

type SubInfo = {
  subscriptionPlan: string;
  subscriptionStatus: string;
};

export function MySubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanInfo[] | null>(null);
  const [upgradePlans, setUpgradePlans] = useState<SubscriptionUpgradePlan[]>([]);
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingUpgrade, setPendingUpgrade] = useState<{ plan: string; label: string; priceRs: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plansRes, subRes, upgradeRes] = await Promise.all([
          apiFetch('/subscription/plans'),
          apiFetch('/me/subscription'),
          apiFetch('/promotions/subscription-plans'),
        ]);
        if (!cancelled) {
          if (plansRes.ok) setPlans((await plansRes.json()) as PlanInfo[]);
          if (subRes.ok) setSub((await subRes.json()) as SubInfo);
          if (upgradeRes.ok) setUpgradePlans((await upgradeRes.json()) as SubscriptionUpgradePlan[]);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleUpgradeClick(plan: string, label: string) {
    const up = upgradePlans.find((u) => u.plan === plan);
    if (!up) return;
    setInitiating(plan);
    try {
      const res = await apiFetch('/promotions/upgrade-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { clientSecret?: string; paymentId?: string; error?: string };
      if (!res.ok) {
        toast(data.error || 'Failed to initiate payment', 'error');
        return;
      }
      setPendingUpgrade({ plan, label, priceRs: up.priceRs });
      setClientSecret(data.clientSecret!);
    } catch {
      toast('Network error', 'error');
    } finally {
      setInitiating(null);
    }
  }

  async function handlePaymentSuccess(_stripePaymentIntentId: string) {
    if (!pendingUpgrade) return;
    // Payment succeeded via Stripe — webhook will activate subscription.
    // Also call upgrade endpoint for immediate activation.
    try {
      const res = await apiFetch('/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pendingUpgrade.plan }),
      });
      if (res.ok) {
        const updated = (await res.json()) as SubInfo;
        setSub(updated);
      }
      await refreshUser();
    } catch {
      // Webhook will handle it if this fails
    }
    toast(`Upgraded to ${pendingUpgrade.label}!`, 'success');
    setPendingUpgrade(null);
    setClientSecret(null);
  }

  function handlePaymentError(message: string) {
    toast(message, 'error');
  }

  function handlePaymentClose() {
    setPendingUpgrade(null);
    setClientSecret(null);
  }

  async function handleCancel() {
    setBusy('cancel');
    try {
      const res = await apiFetch('/subscription/cancel', { method: 'POST' });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        toast(d.error || 'Cancel failed', 'error');
        return;
      }
      const updated = (await res.json()) as SubInfo;
      setSub(updated);
      await refreshUser();
      toast('Downgraded to FREE', 'info');
    } catch {
      toast('Network error', 'error');
    } finally {
      setBusy(null);
    }
  }

  const currentPlan = sub?.subscriptionPlan ?? user?.subscriptionPlan ?? 'FREE';
  const planOrder: Record<string, number> = { FREE: 0, SILVER: 1, GOLD: 2 };

  function getPriceLabel(plan: string): string {
    const up = upgradePlans.find((u) => u.plan === plan);
    if (up) return `Rs ${up.priceRs.toLocaleString()}/mo`;
    return 'Free';
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHead title="My Subscription" />
      <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
      <p className="mt-1 text-sm text-gray-500">Choose a plan that fits your needs</p>

      {/* Plan cards */}
      {plans ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.plan === currentPlan;
            const isHigher = planOrder[p.plan] > planOrder[currentPlan];
            const borderColor = isCurrent ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200';
            const planColors: Record<string, string> = {
              FREE: 'text-gray-600',
              SILVER: 'text-gray-500',
              GOLD: 'text-amber-600',
            };

            return (
              <div key={p.plan} className={`relative rounded-2xl border bg-white p-6 shadow-sm ${borderColor}`}>
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-medium text-white">
                    Current Plan
                  </span>
                )}
                <h3 className={`text-xl font-bold ${planColors[p.plan] ?? 'text-gray-900'}`}>
                  {p.label}
                </h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {getPriceLabel(p.plan)}
                </p>

                <ul className="mt-6 space-y-3">
                  <Feature label="Max listings" value={String(p.maxListings)} />
                  <Feature label="Images per listing" value={String(p.maxImagesPerListing)} />
                  <Feature label="Daily inquiries" value={String(p.dailyInquiries)} />
                  <Feature label="Favorites" enabled={p.favorites} />
                  <Feature label="See seller phone" enabled={p.sellerPhoneReveal} />
                  <Feature label="See seller email" enabled={p.sellerEmailReveal} />
                  <Feature label="Featured listings" enabled={p.featuredListings} />
                  <Feature label="Bump listing" enabled={p.bumpListing} />
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    currentPlan !== 'FREE' ? (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={handleCancel}
                        className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {busy === 'cancel' ? 'Cancelling...' : 'Downgrade to FREE'}
                      </button>
                    ) : (
                      <div className="rounded-lg bg-gray-100 py-2.5 text-center text-sm font-medium text-gray-500">
                        Current plan
                      </div>
                    )
                  ) : isHigher ? (
                    <button
                      type="button"
                      disabled={initiating !== null || busy !== null}
                      onClick={() => handleUpgradeClick(p.plan, p.label)}
                      className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {initiating === p.plan ? 'Preparing payment...' : `Upgrade to ${p.label}`}
                    </button>
                  ) : (
                    <div className="rounded-lg bg-gray-50 py-2.5 text-center text-sm text-gray-400">
                      Lower tier
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        <Link to="/me/billing" className="text-teal-600 hover:underline">View billing history</Link>
      </p>

      {/* Payment Modal */}
      <PaymentModal
        open={!!pendingUpgrade && !!clientSecret}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        amountRs={pendingUpgrade?.priceRs ?? 0}
        description={pendingUpgrade ? `Upgrade to ${pendingUpgrade.label}` : ''}
        clientSecret={clientSecret}
        stripePromise={getStripe()}
      />
    </div>
  );
}

function Feature({ label, value, enabled }: { label: string; value?: string; enabled?: boolean }) {
  if (value !== undefined) {
    return (
      <li className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 text-sm">
      {enabled ? (
        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </li>
  );
}
