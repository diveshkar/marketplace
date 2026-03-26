import { PageHead } from '../components/seo/PageHead';

function TipCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}

export function SafetyTipsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHead title="Safety Tips" description="Stay safe while buying and selling on Marketplace" />

      <h1 className="text-3xl font-bold text-gray-900">Safety Tips</h1>
      <p className="mt-2 text-gray-500">
        Your safety is our priority. Follow these guidelines to stay safe while buying and
        selling on Marketplace.
      </p>

      <div className="mt-10 space-y-6">
        <TipCard title="Meeting in Person">
          <ul className="ml-5 list-disc space-y-2">
            <li>Always meet in a well-lit, public place such as a coffee shop or shopping center.</li>
            <li>Bring a friend or family member with you, especially for high-value items.</li>
            <li>Avoid meeting at your home or the other person's home.</li>
            <li>Schedule meetings during daylight hours whenever possible.</li>
            <li>Let someone know where you are going and when you expect to return.</li>
          </ul>
        </TipCard>

        <TipCard title="Payment Safety">
          <ul className="ml-5 list-disc space-y-2">
            <li>Use cash for in-person transactions when possible.</li>
            <li>Be cautious of overpayment scams where a buyer sends more than the asking price.</li>
            <li>Never share your bank account or credit card details with other users.</li>
            <li>Verify payment has been received before handing over the item.</li>
            <li>Be wary of requests to use unconventional payment methods such as gift cards or wire transfers.</li>
          </ul>
        </TipCard>

        <TipCard title="Protecting Personal Information">
          <ul className="ml-5 list-disc space-y-2">
            <li>Do not share your full name, address, or financial details in listings or messages.</li>
            <li>Use the platform's messaging system rather than sharing your personal phone number or email.</li>
            <li>Be cautious about sharing photos that reveal your location or personal details.</li>
            <li>Use a strong, unique password for your Marketplace account.</li>
          </ul>
        </TipCard>

        <TipCard title="Recognizing Scams">
          <ul className="ml-5 list-disc space-y-2">
            <li>Be skeptical of deals that seem too good to be true.</li>
            <li>Watch out for sellers who refuse to meet in person or show the item before payment.</li>
            <li>Be cautious of buyers or sellers who pressure you to act quickly.</li>
            <li>Verify the identity of the person you are dealing with when possible.</li>
            <li>Never click on suspicious links sent through messages.</li>
          </ul>
        </TipCard>

        <TipCard title="Reporting Suspicious Activity">
          <ul className="ml-5 list-disc space-y-2">
            <li>If something feels wrong, trust your instincts and walk away from the transaction.</li>
            <li>Report suspicious listings or users using the report button on their profile or listing.</li>
            <li>Contact local law enforcement if you believe you have been the victim of fraud.</li>
            <li>Reach out to our support team through the Contact page for assistance.</li>
          </ul>
        </TipCard>
      </div>
    </div>
  );
}
