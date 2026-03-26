import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  onError: (message: string) => void;
  amountRs: number;
  description: string;
  clientSecret: string | null;
  stripePromise: Promise<Stripe | null>;
};

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
  hidePostalCode: true,
};

function CheckoutForm({
  onClose,
  onSuccess,
  onError,
  amountRs,
  description,
  clientSecret,
}: Omit<Props, 'open' | 'stripePromise'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setBusy(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setBusy(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret!, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setCardError(error.message ?? 'Payment failed');
      onError(error.message ?? 'Payment failed');
      setBusy(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setCardError('Payment was not completed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {/* Amount */}
      <div className="border-b bg-gray-50 px-6 py-4 text-center">
        <p className="text-sm text-gray-500">Amount to pay</p>
        <p className="text-3xl font-bold text-gray-900">Rs {amountRs.toLocaleString()}</p>
      </div>

      {/* Stripe Card Element */}
      <div className="px-6 pt-5">
        <label className="mb-2 block text-xs font-medium text-gray-600">Card Details</label>
        <div className="rounded-lg border border-gray-300 px-3 py-3 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600">{cardError}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Test card: 4242 4242 4242 4242 &middot; Any future expiry &middot; Any CVC
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-5">
        <button
          type="submit"
          disabled={busy || !stripe}
          className="w-full rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay Rs ${amountRs.toLocaleString()}`
          )}
        </button>
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secured by Stripe — card data never touches our servers
        </div>
      </div>
    </form>
  );
}

export function PaymentModal({
  open,
  onClose,
  onSuccess,
  onError,
  amountRs,
  description,
  clientSecret,
  stripePromise,
}: Props) {
  if (!open || !clientSecret) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" role="dialog" aria-modal="true">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe' },
          }}
        >
          <CheckoutForm
            open={open}
            onClose={onClose}
            onSuccess={onSuccess}
            onError={onError}
            amountRs={amountRs}
            description={description}
            clientSecret={clientSecret}
          />
        </Elements>
      </div>
    </div>
  );
}
