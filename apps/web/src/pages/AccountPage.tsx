import { useEffect, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { useToast } from '../components/ui/Toast';
import { PageHead } from '../components/seo/PageHead';

export function AccountPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch('/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await refreshUser();
      toast('Profile updated!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHead title="My Account" />
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Profile info */}
      {user && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Profile Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Email</p>
              <p className="mt-0.5 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Role</p>
              <p className="mt-0.5 text-sm text-gray-900">{user.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Subscription</p>
              <span className="mt-0.5 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                {user.subscriptionPlan}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Member Since</p>
              <p className="mt-0.5 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit name */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>
        <form className="mt-4" onSubmit={onSave}>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Display Name</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
