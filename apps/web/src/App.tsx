import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';

const BrowsePage = lazy(() => import('./pages/BrowsePage').then(m => ({ default: m.BrowsePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const NewListingPage = lazy(() => import('./pages/NewListingPage').then(m => ({ default: m.NewListingPage })));
const ListingsMinePage = lazy(() => import('./pages/ListingsMinePage').then(m => ({ default: m.ListingsMinePage })));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage').then(m => ({ default: m.ListingDetailPage })));
const EditListingPage = lazy(() => import('./pages/EditListingPage').then(m => ({ default: m.EditListingPage })));
const SellerProfilePage = lazy(() => import('./pages/SellerProfilePage').then(m => ({ default: m.SellerProfilePage })));
const RecentlyViewedPage = lazy(() => import('./pages/RecentlyViewedPage').then(m => ({ default: m.RecentlyViewedPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const SellerInboxPage = lazy(() => import('./pages/SellerInboxPage').then(m => ({ default: m.SellerInboxPage })));
const MyFavoritesPage = lazy(() => import('./pages/MyFavoritesPage').then(m => ({ default: m.MyFavoritesPage })));
const MyInquiriesPage = lazy(() => import('./pages/MyInquiriesPage').then(m => ({ default: m.MyInquiriesPage })));
const MyNotificationsPage = lazy(() => import('./pages/MyNotificationsPage').then(m => ({ default: m.MyNotificationsPage })));
const MySubscriptionPage = lazy(() => import('./pages/MySubscriptionPage').then(m => ({ default: m.MySubscriptionPage })));
const PromotePage = lazy(() => import('./pages/PromotePage').then(m => ({ default: m.PromotePage })));
const SubscriptionUpgradePage = lazy(() => import('./pages/SubscriptionUpgradePage').then(m => ({ default: m.SubscriptionUpgradePage })));
const BillingHistoryPage = lazy(() => import('./pages/BillingHistoryPage').then(m => ({ default: m.BillingHistoryPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const SafetyTipsPage = lazy(() => import('./pages/SafetyTipsPage').then(m => ({ default: m.SafetyTipsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/account"
            element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
          />
          <Route
            path="/listings/new"
            element={<ProtectedRoute><NewListingPage /></ProtectedRoute>}
          />
          <Route
            path="/listings"
            element={<ProtectedRoute><ListingsMinePage /></ProtectedRoute>}
          />
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />
          <Route path="/sellers/:userId" element={<SellerProfilePage />} />
          <Route path="/recently-viewed" element={<RecentlyViewedPage />} />
          <Route
            path="/listings/:listingId/edit"
            element={<ProtectedRoute><EditListingPage /></ProtectedRoute>}
          />
          <Route
            path="/me/messages"
            element={<ProtectedRoute><MessagesPage /></ProtectedRoute>}
          />
          <Route
            path="/me/inbox"
            element={<ProtectedRoute><SellerInboxPage /></ProtectedRoute>}
          />
          <Route
            path="/me/favorites"
            element={<ProtectedRoute><MyFavoritesPage /></ProtectedRoute>}
          />
          <Route
            path="/me/inquiries"
            element={<ProtectedRoute><MyInquiriesPage /></ProtectedRoute>}
          />
          <Route
            path="/me/notifications"
            element={<ProtectedRoute><MyNotificationsPage /></ProtectedRoute>}
          />
          <Route
            path="/me/subscription"
            element={<ProtectedRoute><MySubscriptionPage /></ProtectedRoute>}
          />
          <Route
            path="/me/promote"
            element={<ProtectedRoute><PromotePage /></ProtectedRoute>}
          />
          <Route
            path="/me/upgrade"
            element={<ProtectedRoute><SubscriptionUpgradePage /></ProtectedRoute>}
          />
          <Route
            path="/me/billing"
            element={<ProtectedRoute><BillingHistoryPage /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute><AdminPage /></ProtectedRoute>}
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/safety" element={<SafetyTipsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
