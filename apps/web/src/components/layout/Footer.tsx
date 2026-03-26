import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer aria-label="Footer" className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Marketplace</h3>
            <p className="mt-2 text-sm text-gray-500">
              Buy and sell anything locally. Connect with sellers in your area.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-2 space-y-1.5">
              <li><Link to="/browse" className="text-sm text-gray-500 hover:text-teal-600">Browse Ads</Link></li>
              <li><Link to="/listings/new" className="text-sm text-gray-500 hover:text-teal-600">Post an Ad</Link></li>
              <li><Link to="/me/subscription" className="text-sm text-gray-500 hover:text-teal-600">Subscription Plans</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Support</h3>
            <ul className="mt-2 space-y-1.5">
              <li><Link to="/safety" className="text-sm text-gray-500 hover:text-teal-600">Safety Tips</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-500 hover:text-teal-600">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-500 hover:text-teal-600">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
