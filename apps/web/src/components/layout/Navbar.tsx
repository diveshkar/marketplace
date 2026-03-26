import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/use-auth';
import { useNotificationCount } from '../../hooks/use-notification-count';
import { useMessageCount } from '../../hooks/use-message-count';

export function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useNotificationCount();
  const unreadMessages = useMessageCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-xl font-bold text-teal-600">
          Marketplace
        </Link>

        {/* Search bar — desktop */}
        <form onSubmit={handleSearch} className="hidden flex-1 md:flex">
          <div className="flex w-full max-w-lg">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-l-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="rounded-r-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-2 md:flex">
          <Link
            to="/browse"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            Browse
          </Link>

          {token && user ? (
            <>
              <Link
                to="/listings/new"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                + Post Ad
              </Link>

              {/* Messages */}
              <Link
                to="/me/messages"
                className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ChatIcon />
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notification bell */}
              <Link
                to="/me/notifications"
                className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <UserIcon />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDownIcon />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                        {user.subscriptionPlan}
                      </span>
                    </div>
                    <Link
                      to="/listings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Ads
                    </Link>
                    <Link
                      to="/me/messages"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Messages
                      {unreadMessages > 0 && (
                        <span className="rounded-full bg-teal-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/me/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Favorites
                    </Link>
                    <Link
                      to="/me/inquiries"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Inquiries
                    </Link>
                    <Link
                      to="/me/inbox"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Seller Inbox
                    </Link>
                    <Link
                      to="/me/promote"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Promote Listing
                    </Link>
                    <Link
                      to="/me/subscription"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Subscription
                    </Link>
                    <Link
                      to="/me/billing"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Billing History
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Account Settings
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <XIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 md:hidden">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex gap-2 py-3">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-teal-600 px-3 py-2 text-white">
              <SearchIcon />
            </button>
          </form>

          <nav className="flex flex-col gap-1">
            <MobileLink to="/browse" onClick={() => setMobileOpen(false)}>Browse</MobileLink>

            {token && user ? (
              <>
                <MobileLink to="/listings/new" onClick={() => setMobileOpen(false)} highlight>
                  + Post Ad
                </MobileLink>
                <MobileLink to="/listings" onClick={() => setMobileOpen(false)}>My Ads</MobileLink>
                <MobileLink to="/me/messages" onClick={() => setMobileOpen(false)}>
                  Messages{unreadMessages > 0 && (
                    <span className="ml-2 rounded-full bg-teal-500 px-2 py-0.5 text-xs text-white">{unreadMessages}</span>
                  )}
                </MobileLink>
                <MobileLink to="/me/favorites" onClick={() => setMobileOpen(false)}>Favorites</MobileLink>
                <MobileLink to="/recently-viewed" onClick={() => setMobileOpen(false)}>Recently Viewed</MobileLink>
                <MobileLink to="/me/inquiries" onClick={() => setMobileOpen(false)}>Inquiries</MobileLink>
                <MobileLink to="/me/inbox" onClick={() => setMobileOpen(false)}>Seller Inbox</MobileLink>
                <MobileLink to="/me/notifications" onClick={() => setMobileOpen(false)}>
                  Notifications{unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadCount}</span>
                  )}
                </MobileLink>
                <MobileLink to="/me/promote" onClick={() => setMobileOpen(false)}>Promote Listing</MobileLink>
                <MobileLink to="/me/subscription" onClick={() => setMobileOpen(false)}>Subscription</MobileLink>
                <MobileLink to="/me/billing" onClick={() => setMobileOpen(false)}>Billing History</MobileLink>
                <MobileLink to="/account" onClick={() => setMobileOpen(false)}>Account</MobileLink>
                {user.role === 'ADMIN' && (
                  <MobileLink to="/admin" onClick={() => setMobileOpen(false)}>Admin Panel</MobileLink>
                )}
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="mt-2 rounded-lg border border-red-200 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/login" onClick={() => setMobileOpen(false)}>Log in</MobileLink>
                <MobileLink to="/register" onClick={() => setMobileOpen(false)} highlight>Register</MobileLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  to, onClick, children, highlight,
}: {
  to: string; onClick: () => void; children: React.ReactNode; highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${
        highlight
          ? 'bg-teal-600 text-center text-white hover:bg-teal-700'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}

// ── Inline SVG Icons ──────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
