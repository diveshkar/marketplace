import { PageHead } from '../components/seo/PageHead';

export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHead title="Terms of Service" description="Terms of Service for Marketplace" />

      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: January 1, 2026</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          By accessing or using Marketplace, you agree to be bound by these Terms of Service
          and all applicable laws and regulations. If you do not agree with any of these terms,
          you are prohibited from using or accessing this platform. We reserve the right to
          modify these terms at any time, and your continued use of the platform constitutes
          acceptance of any changes.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">2. User Accounts</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          To access certain features of Marketplace, you must create an account. You are
          responsible for maintaining the confidentiality of your account credentials and for
          all activities that occur under your account. You agree to provide accurate,
          current, and complete information during registration and to update such information
          as necessary. We reserve the right to suspend or terminate accounts that violate
          these terms.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">3. Listings &amp; Transactions</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          Marketplace provides a platform for users to list items for sale and to browse
          listings posted by other users. We do not take ownership of or responsibility for
          items listed on the platform. All transactions are conducted directly between buyers
          and sellers. You agree that Marketplace is not a party to any transaction and shall
          not be held liable for any disputes arising between users regarding the quality,
          safety, legality, or delivery of listed items.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">4. Prohibited Items</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          You may not list items that are illegal, stolen, counterfeit, or otherwise
          prohibited by applicable law. This includes but is not limited to weapons,
          controlled substances, hazardous materials, and items that infringe on intellectual
          property rights. Marketplace reserves the right to remove any listing at its sole
          discretion and to suspend or terminate the accounts of users who violate this
          policy.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">5. Limitation of Liability</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          Marketplace is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          basis. To the fullest extent permitted by law, Marketplace disclaims all warranties,
          express or implied, including but not limited to warranties of merchantability,
          fitness for a particular purpose, and non-infringement. In no event shall
          Marketplace be liable for any indirect, incidental, special, consequential, or
          punitive damages arising out of or related to your use of the platform.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">6. Changes to Terms</h2>
        <p className="mt-3 leading-relaxed text-gray-600">
          We reserve the right to update or modify these Terms of Service at any time without
          prior notice. Changes will be effective immediately upon posting to the platform.
          Your continued use of Marketplace after any changes indicates your acceptance of the
          new terms. We encourage you to review these terms periodically to stay informed of
          any updates.
        </p>
      </section>
    </div>
  );
}
