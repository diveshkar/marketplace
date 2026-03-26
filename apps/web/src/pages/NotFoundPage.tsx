import { Link } from 'react-router-dom';
import { PageHead } from '../components/seo/PageHead';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-16 text-center">
      <PageHead title="Page Not Found" />
      <p className="text-7xl font-bold text-teal-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-500">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
