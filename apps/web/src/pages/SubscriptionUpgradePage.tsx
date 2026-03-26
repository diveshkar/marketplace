import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SubscriptionUpgradePlan } from '@marketplace/shared-types';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { getStripe } from '../lib/stripe';
import { useToast } from '../components/ui/Toast';
import { PaymentModal } from '../components/ui/PaymentModal';
import { PageHead } from '../components/seo/PageHead';

export function SubscriptionUpgradePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionUpgradePlan[] | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<SubscriptionUpgradePlan | null>(null);
  const [success, setSuccess] = useState<{ plan: string; paymentId: string } | null>(null);

  const currentPlan = user?.subscriptionPlan ?? 'FREE';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/promotions/subscription-plans');
        if (!cancelled && res.ok) setPlans((await res.json()) as SubscriptionUpgradePlan[]);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleUpgradeClick(plan: SubscriptionUpgradePlan) {
    setInitiating(true);
    try {
      const res = await apiFetch('/promotions/upgrade-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.plan }),
      });
      const data = (await res.json()) as { clientSecret?: string; paymentId?: string; error?: string };
      if (!res.ok) {
        toast(data.error || 'Failed to initiate payment', 'error');
        return;
      }
      setPendingPlan(plan);
      setClientSecret(data.clientSecret!);
    } catch {
      toast('Network error', 'error');
    } finally {
      setInitiating(false);
    }
  }

  async function handlePaymentSuccess(stripePaymentIntentId: string) {
    if (!pendingPlan) return;
    // Payment succeeded — webhook will activate subscription.
    // We also call the upgrade endpoint to activate immediately for responsiveness.
    try {
      await apiFetch('/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pendingPlan.plan }),
      });
      await refreshUser();
    } catch {
      // Webhook will handle it if this fails
    }
    setSuccess({ plan: pendingPlan.plan, paymentId: stripePaymentIntentId });
    setPendingPlan(null);
    setClientSecret(null);
    toast(`Upgraded to ${pendingPlan.label}!`, 'success');
  }

  function handlePaymentError(message: string) {
    toast(message, 'error');
  }

  function handleClose() {
    setPendingPlan(null);
    setClientSecret(null);
  }

  const planOrder: Record<string, number> = { FREE: 0, SILVER: 1, GOLD: 2 };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="Upgrade Plan" />
      <h1 className="text-2xl font-bold text-gray-900">Upgrade Subscription</h1>
      <p className="mt-1 text-sm text-gray-500">
        Unlock premium features with a paid subscription
      </p>

      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          <p className="font-semibold">Payment successful!</p>
          <p className="mt-1">You are now on the {success.plan} plan.</p>
          <Link to="/me/billing" className="mt-2 inline-block text-teal-600 hover:underline">
            View billing history
          </Link>
        </div>
      )}

      {plans === null ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {plans.map((p) => {
            const isCurrent = p.plan === currentPlan;
            const isUpgrade = planOrder[p.plan] > planOrder[currentPlan];
            const borderColor = isCurrent
              ? 'border-teal-500 ring-2 ring-teal-200'
              : 'border-gray-200';
            const planColor = p.plan === 'GOLD' ? 'text-amber-600' : 'text-gray-500';

            return (
              <div key={p.plan} className={`relative rounded-2xl border bg-white p-6 shadow-sm ${borderColor}`}>
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-medium text-white">
                    Current Plan
                  </span>
                )}
                <h3 className={`text-xl font-bold ${planColor}`}>{p.label}</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  Rs {p.priceRs.toLocaleString()}
                  <span className="text-base font-normal text-gray-400">/{p.period}</span>
                </p>

                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <div className="rounded-lg bg-gray-100 py-2.5 text-center text-sm font-medium text-gray-500">
                      Current plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      type="button"
                      disabled={initiating}
                      onClick={() => handleUpgradeClick(p)}
                      className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {initiating ? 'Preparing payment...' : `Upgrade to ${p.label} — Rs ${p.priceRs.toLocaleString()}`}
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
      )}

      <PaymentModal
        open={!!pendingPlan && !!clientSecret}
        onClose={handleClose}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        amountRs={pendingPlan?.priceRs ?? 0}
        description={pendingPlan ? `Upgrade to ${pendingPlan.label} (${pendingPlan.period}ly)` : ''}
        clientSecret={clientSecret}
        stripePromise={getStripe()}
      />

      <div className="mt-8 text-center">
        <Link to="/me/subscription" className="text-sm text-teal-600 hover:underline">
          View current subscription details
        </Link>
      </div>
    </div>
  );
}
