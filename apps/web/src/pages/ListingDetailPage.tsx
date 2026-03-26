import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Listing, ListingDetailResponse, ListingSearchHit, ListingSellerSnapshot } from '@marketplace/shared-types';
import { getCategoryName, getSubcategoryName, getCityName, getDistrictName } from '@marketplace/shared-utils';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ListingCard } from '../components/ui/ListingCard';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { addRecentlyViewed } from '../lib/recently-viewed';
import { PageHead } from '../components/seo/PageHead';

export function ListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<ListingSellerSnapshot | null>(null);
  const [viewerPlan, setViewerPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  // Favorites
  const [isFav, setIsFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  // Inquiry
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquiryBusy, setInquiryBusy] = useState(false);

  // Chat
  const [chatBusy, setChatBusy] = useState(false);

  // Report
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportBusy, setReportBusy] = useState(false);

  // Related listings
  const [relatedListings, setRelatedListings] = useState<ListingSearchHit[]>([]);

  // Share
  const [copied, setCopied] = useState(false);

  const isOwner = user && listing && user.userId === listing.userId;

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/listings/${listingId}`);
        const data = (await res.json().catch(() => null)) as ListingDetailResponse | { error?: string } | null;
        if (cancelled) return;
        if (!res.ok) {
          setError(data && 'error' in data ? String(data.error) : 'Not found');
          return;
        }
        const detail = data as ListingDetailResponse;
        setListing(detail.listing);
        setSeller(detail.seller);
        setViewerPlan(detail.viewer.subscriptionPlan);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => { cancelled = true; };
  }, [listingId]);

  // Check favorites
  useEffect(() => {
    if (!user || !listingId || user.subscriptionPlan === 'FREE') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/me/favorites');
        if (res.ok && !cancelled) {
          const favs = (await res.json()) as { listingId: string }[];
          setIsFav(favs.some((f) => f.listingId === listingId));
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user, listingId]);

  // Track view + save to recently viewed
  useEffect(() => {
    if (!listingId || !listing) return;
    // Increment server view count (fire-and-forget)
    apiFetch(`/listings/${listingId}/view`, { method: 'POST' }).catch(() => {});
    // Save to local recently-viewed
    addRecentlyViewed({
      listingId: listing.listingId,
      title: listing.title,
      price: listing.price,
      city: listing.city,
      imageKey: listing.imageKeys?.[0],
    });
  }, [listingId, listing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load related listings (same category, excluding this one)
  useEffect(() => {
    if (!listing || listing.status !== 'ACTIVE') return;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ category: listing.category });
        const res = await apiFetch(`/search?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = (await res.json()) as ListingSearchHit[];
          setRelatedListings(
            data.filter((l) => l.listingId !== listing.listingId).slice(0, 4)
          );
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [listing?.listingId, listing?.category, listing?.status]);

  async function toggleFavorite() {
    if (!listingId || !user) return;
    setFavBusy(true);
    try {
      if (isFav) {
        const res = await apiFetch(`/listings/${listingId}/favorite`, { method: 'DELETE' });
        if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Failed'); }
        setIsFav(false);
        toast('Removed from favorites', 'info');
      } else {
        const res = await apiFetch(`/listings/${listingId}/favorite`, { method: 'POST' });
        if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Failed'); }
        setIsFav(true);
        toast('Added to favorites', 'success');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Favorite failed', 'error');
    } finally {
      setFavBusy(false);
    }
  }

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId || !inquiryMsg.trim()) return;
    setInquiryBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inquiryMsg.trim() }),
      });
      if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Failed'); }
      setInquiryMsg('');
      toast('Inquiry sent to seller!', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Inquiry failed', 'error');
    } finally {
      setInquiryBusy(false);
    }
  }

  async function startChat() {
    if (!listingId) return;
    setChatBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi, I\'m interested in this item.' }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || 'Failed');
      }
      const data = (await res.json()) as { conversation: { conversationId: string } };
      navigate(`/me/messages?c=${data.conversation.conversationId}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Chat failed', 'error');
    } finally {
      setChatBusy(false);
    }
  }

  async function submitListing() {
    if (!listingId) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}/submit`, { method: 'POST' });
      if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Failed'); }
      toast('Submitted for review!', 'success');
      const r = await apiFetch(`/listings/${listingId}`);
      if (r.ok) { const d = (await r.json()) as ListingDetailResponse; setListing(d.listing); setSeller(d.seller); }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Submit failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function markSold() {
    if (!listingId) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}/sold`, { method: 'POST' });
      if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Failed'); }
      toast('Marked as sold!', 'success');
      const r = await apiFetch(`/listings/${listingId}`);
      if (r.ok) { const d = (await r.json()) as ListingDetailResponse; setListing(d.listing); setSeller(d.seller); }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!listingId || reportReason.trim().length < 5) return;
    setReportBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Failed'); }
      setReportOpen(false);
      setReportReason('');
      toast('Report submitted. Thank you!', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Report failed', 'error');
    } finally {
      setReportBusy(false);
    }
  }

  async function deleteListing() {
    if (!listingId) return;
    if (!window.confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/listings/${listingId}`, { method: 'DELETE' });
      if (!res.ok) { const d = (await res.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error || 'Delete failed'); }
      toast('Listing deleted', 'success');
      navigate('/listings', { replace: true });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function uploadSelectedImage(file: File) {
    if (!listingId || !file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { toast('Only JPEG, PNG, WebP, or GIF images.', 'error'); return; }
    setBusy(true);
    try {
      const urlRes = await apiFetch(`/listings/${listingId}/upload-url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      });
      const urlData = (await urlRes.json().catch(() => ({}))) as { error?: string; key?: string; uploadUrl?: string; headers?: Record<string, string> };
      if (!urlRes.ok) throw new Error(urlData.error || 'Upload start failed');
      if (!urlData.uploadUrl || !urlData.headers || !urlData.key) throw new Error('Invalid upload response');
      const putRes = await fetch(urlData.uploadUrl, { method: 'PUT', body: file, headers: new Headers(urlData.headers), credentials: 'omit' });
      if (!putRes.ok) throw new Error('Upload to storage failed');
      const doneRes = await apiFetch(`/listings/${listingId}/upload-complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: urlData.key }),
      });
      const doneData = (await doneRes.json().catch(() => ({}))) as Listing & { error?: string };
      if (!doneRes.ok) throw new Error(doneData.error || 'Finalize failed');
      setListing(doneData);
      toast('Image uploaded!', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!listingId) return <p className="p-8 text-red-600">Invalid listing ID</p>;

  const showFavoriteButton = user && listing && !isOwner && listing.status === 'ACTIVE' && user.subscriptionPlan !== 'FREE';
  const showInquiryForm = user && listing && !isOwner && listing.status === 'ACTIVE';
  const canUploadImages = isOwner && listing && (listing.status === 'DRAFT' || listing.status === 'PENDING');
  const images = listing?.imageKeys ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHead title={listing?.title} description={listing ? `Rs ${listing.price.toLocaleString()} — ${listing.title}` : undefined} />
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-teal-600">Home</Link>
        <span>/</span>
        <Link to="/browse" className="hover:text-teal-600">Browse</Link>
        {listing && (
          <>
            <span>/</span>
            <span className="text-gray-700">{listing.title}</span>
          </>
        )}
      </nav>

      {error && !listing && (
        <div className="flex flex-col items-center py-16">
          <p className="text-lg font-medium text-red-600">{error}</p>
          <Link to="/browse" className="mt-4 text-sm text-teal-600 hover:underline">Back to Browse</Link>
        </div>
      )}
      {!listing && !error && (
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-80 rounded-xl bg-gray-200" />
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-200" />
        </div>
      )}

      {listing && (
        <>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left — Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[16/10] bg-gray-100">
                    <OptimizedImage
                      imageKey={images[selectedImg]}
                      alt={listing.title}
                      className="h-full w-full object-contain"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedImg((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                        >
                          <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedImg((prev) => (prev + 1) % images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                        >
                          <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                          {selectedImg + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto p-2">
                      {images.map((key, i) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedImg(i)}
                          className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                            i === selectedImg ? 'border-teal-500' : 'border-transparent'
                          }`}
                        >
                          <OptimizedImage imageKey={key} alt="" thumbnail className="h-16 w-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-gray-100 text-gray-300">
                  <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload images (owner) */}
            {canUploadImages && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-teal-400">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Add photos</span>
                  <span className="text-xs text-gray-400">JPEG, PNG, WebP or GIF</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={busy}
                    className="hidden"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      ev.target.value = '';
                      if (f) void uploadSelectedImage(f);
                    }}
                  />
                </label>
                <p className="mt-2 text-center text-xs text-gray-400">
                  Plan limits: FREE 3 | SILVER 8 | GOLD 15 images
                </p>
              </div>
            )}

            {/* Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 font-semibold text-gray-900">Description</h2>
              <p className="whitespace-pre-wrap text-gray-700">
                {listing.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Price & title card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <StatusBadge status={listing.status} />
                {showFavoriteButton && (
                  <button
                    type="button"
                    disabled={favBusy}
                    onClick={() => void toggleFavorite()}
                    className={`rounded-lg p-2 transition ${
                      isFav
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500'
                    }`}
                  >
                    <svg className="h-5 w-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-2xl font-bold text-gray-900">Rs {listing.price.toLocaleString()}</p>
                {listing.negotiable && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Negotiable</span>
                )}
              </div>
              <h1 className="mt-1 text-lg text-gray-800">{listing.title}</h1>
              {listing.activePromotion && (
                <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${
                  listing.activePromotion === 'TOP_AD' ? 'bg-purple-100 text-purple-700'
                    : listing.activePromotion === 'FEATURED' ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                }`}>
                  {listing.activePromotion === 'TOP_AD' ? 'Top Ad' : listing.activePromotion === 'FEATURED' ? 'Featured' : 'Bumped'}
                </span>
              )}
              {listing.condition && (
                <span className="mt-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {listing.condition === 'new' ? 'Brand New' : listing.condition === 'reconditioned' ? 'Reconditioned' : 'Used'}
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.district && listing.province
                    ? `${getCityName(listing.province, listing.district, listing.city)}, ${getDistrictName(listing.province, listing.district)}`
                    : listing.city}
                </span>
                <span>
                  {getCategoryName(listing.category)}
                  {listing.subcategory && ` > ${getSubcategoryName(listing.category, listing.subcategory)}`}
                </span>
                {(listing.views ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {listing.views} {listing.views === 1 ? 'view' : 'views'}
                  </span>
                )}
              </div>
            </div>

            {/* Seller info */}
            {seller && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900">Seller Information</h3>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    to={`/sellers/${seller.userId}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 hover:bg-teal-200"
                  >
                    {seller.name.charAt(0).toUpperCase()}
                  </Link>
                  <div>
                    <Link to={`/sellers/${seller.userId}`} className="font-medium text-gray-900 hover:text-teal-600">
                      {seller.name}
                    </Link>
                    {seller.phone && (
                      <a href={`tel:${seller.phone}`} className="text-sm text-teal-600 hover:underline">
                        {seller.phone}
                      </a>
                    )}
                    {seller.email && (
                      <p className="text-sm text-teal-600">{seller.email}</p>
                    )}
                  </div>
                </div>
                {!seller.phone && !seller.email && viewerPlan === 'FREE' && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                    Upgrade to SILVER or GOLD to see seller contact details.
                    <Link to="/me/subscription" className="ml-1 font-medium underline">Upgrade</Link>
                  </div>
                )}
                {seller.phone && !seller.email && viewerPlan === 'SILVER' && (
                  <p className="mt-2 text-xs text-gray-400">Upgrade to GOLD to see seller email.</p>
                )}
              </div>
            )}

            {/* Inquiry form */}
            {showInquiryForm && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900">Contact Seller</h3>
                <form onSubmit={(e) => void sendInquiry(e)} className="mt-3">
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    rows={3}
                    maxLength={2000}
                    placeholder="Hi, I'm interested in this item..."
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={inquiryBusy || !inquiryMsg.trim()}
                    className="mt-2 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {inquiryBusy ? 'Sending...' : 'Send Inquiry'}
                  </button>
                  <p className="mt-2 text-center text-xs text-gray-400">
                    Daily limits: FREE 3 | SILVER 15 | GOLD 50
                  </p>
                </form>
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={chatBusy}
                    onClick={() => void startChat()}
                    className="w-full rounded-lg border border-teal-300 py-2.5 text-sm font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-50"
                  >
                    {chatBusy ? 'Opening...' : 'Chat with Seller'}
                  </button>
                </div>
              </div>
            )}

            {!user && listing.status === 'ACTIVE' && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <p className="text-sm text-gray-600">
                  <Link to="/login" className="font-medium text-teal-600 hover:underline">Log in</Link> to contact the seller
                </p>
              </div>
            )}

            {user && !isOwner && user.subscriptionPlan === 'FREE' && listing.status === 'ACTIVE' && (
              <p className="text-center text-xs text-gray-400">
                Favorites require SILVER or GOLD plan.
              </p>
            )}

            {/* Owner actions */}
            {isOwner && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900">Manage Listing</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {(listing.status === 'DRAFT' || listing.status === 'PENDING') && (
                    <Link
                      to={`/listings/${listingId}/edit`}
                      className="w-full rounded-lg border border-teal-300 py-2 text-center text-sm font-medium text-teal-600 hover:bg-teal-50"
                    >
                      Edit Listing
                    </Link>
                  )}
                  {listing.status === 'DRAFT' && (
                    <button type="button" disabled={busy} onClick={() => void submitListing()}
                      className="w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                      Submit for Review
                    </button>
                  )}
                  {listing.status === 'ACTIVE' && (
                    <button type="button" disabled={busy} onClick={() => void markSold()}
                      className="w-full rounded-lg border border-blue-300 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                      Mark as Sold
                    </button>
                  )}
                  {listing.status === 'PENDING' && (
                    <p className="text-center text-sm text-amber-600">Awaiting admin approval</p>
                  )}
                  {(['DRAFT', 'REJECTED', 'SOLD'] as string[]).includes(listing.status) && (
                    <button type="button" disabled={busy} onClick={() => void deleteListing()}
                      className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                      Delete Listing
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Report + plan info */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              {viewerPlan && (
                <span>
                  Viewing as {viewerPlan}
                  {viewerPlan === 'FREE' && ' (limited images)'}
                </span>
              )}
              {user && !isOwner && listing.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="text-gray-400 hover:text-red-500"
                >
                  Report this ad
                </button>
              )}
            </div>
            {/* Share buttons */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Share</h3>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${listing.title} - Rs ${listing.price.toLocaleString()}\n${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white hover:bg-green-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.626-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.115 0-4.107-.636-5.753-1.732l-.413-.253-2.746.871.876-2.674-.276-.427A9.713 9.713 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Safety tips */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">Safety Tips</h3>
              <ul className="space-y-1 text-xs text-amber-800">
                <li>- Meet in a public place for exchanges</li>
                <li>- Check the item before making a payment</li>
                <li>- Never send advance payments to strangers</li>
                <li>- Verify seller identity before large purchases</li>
                <li>- Report suspicious listings immediately</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related listings */}
        {relatedListings.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Similar Listings</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {relatedListings.map((l) => (
                <ListingCard
                  key={l.listingId}
                  listingId={l.listingId}
                  title={l.title}
                  price={l.price}
                  city={l.city}
                  category={l.category}
                  imageKeys={l.imageKeys}
                  condition={l.condition}
                  createdAt={l.createdAt}
                  negotiable={l.negotiable}
                />
              ))}
            </div>
          </div>
        )}
        </>
      )}

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Listing">
        <p className="text-sm text-gray-600">Why are you reporting this listing?</p>
        <textarea
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
          rows={3}
          maxLength={500}
          minLength={5}
          placeholder="Describe the issue (min 5 characters)..."
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setReportOpen(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={reportBusy || reportReason.trim().length < 5}
            onClick={() => void submitReport()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {reportBusy ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
