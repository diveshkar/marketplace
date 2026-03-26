import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Payment } from '@marketplace/shared-types';
import { apiFetch } from '../lib/api-client';
import { PageHead } from '../components/seo/PageHead';

export function BillingHistoryPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/me/payments');
        if (!cancelled && res.ok) setPayments((await res.json()) as Payment[]);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHead title="Billing History" />
      <h1 className="text-2xl font-bold text-gray-900">Billing History</h1>
      <p className="mt-1 text-sm text-gray-500">Your payment records</p>

      {payments === null ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="mt-10 text-center text-gray-400">
          <p className="text-lg">No payments yet</p>
          <p className="mt-1 text-sm">
            <Link to="/me/promote" className="text-teal-600 hover:underline">Promote a listing</Link>{' '}
            or{' '}
            <Link to="/me/upgrade" className="text-teal-600 hover:underline">upgrade your subscription</Link>
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 font-medium">Purpose</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.paymentId} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{p.description}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.purpose === 'PROMOTION'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {p.purpose === 'PROMOTION' ? 'Promotion' : 'Subscription'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium ${
                      p.status === 'COMPLETED' ? 'text-green-600'
                        : p.status === 'PENDING' ? 'text-amber-600'
                          : 'text-red-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    Rs {p.amountRs.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
