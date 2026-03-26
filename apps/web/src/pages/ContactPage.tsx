import { useState } from 'react';
import { PageHead } from '../components/seo/PageHead';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-gray-900 hover:text-teal-600"
      >
        <span className="font-medium">{question}</span>
        <span className="ml-4 shrink-0 text-xl">{open ? '\u2212' : '+'}</span>
      </button>
      {open && <p className="pb-4 leading-relaxed text-gray-600">{answer}</p>}
    </div>
  );
}

const faqs = [
  {
    question: 'How do I create a listing?',
    answer:
      'Sign in to your account, click "Post an Ad" in the navigation bar, fill in the details about your item including photos, description, and price, then publish your listing.',
  },
  {
    question: 'Is it free to list items on Marketplace?',
    answer:
      'Basic listings are free. We also offer premium subscription plans that include features like promoted listings, higher visibility, and priority support.',
  },
  {
    question: 'How do I report a suspicious listing?',
    answer:
      'Navigate to the listing in question and click the "Report" button. Provide a brief description of your concern and our moderation team will review it promptly.',
  },
  {
    question: 'Can I edit or delete my listing after posting?',
    answer:
      'Yes. Go to your account dashboard, find the listing under "My Listings," and use the edit or delete options. Changes are reflected immediately.',
  },
  {
    question: 'How do I contact a seller?',
    answer:
      'On any listing page, click the "Message Seller" button to start a conversation through our built-in messaging system. This keeps your personal contact information private.',
  },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHead title="Contact Us" description="Get in touch with the Marketplace team" />

      <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
      <p className="mt-2 text-gray-500">
        Have a question or need help? Send us a message and we will get back to you as soon as
        possible.
      </p>

      {/* Toast */}
      {submitted && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Message sent! We will get back to you shortly.
        </div>
      )}

      {/* Contact form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={form.subject}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Select a topic...</option>
            <option value="general">General Inquiry</option>
            <option value="account">Account Issue</option>
            <option value="listing">Listing Problem</option>
            <option value="report">Report a User</option>
            <option value="billing">Billing &amp; Subscriptions</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            value={form.message}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
        >
          Send Message
        </button>
      </form>

      {/* FAQ section */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <div className="mt-6">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
