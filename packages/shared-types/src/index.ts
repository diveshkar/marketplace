/** Domain roles (PLAN_v2 — Authentication). */
export type UserRole = 'USER' | 'ADMIN';

/** Subscription tiers (PLAN_v2 — Subscription Model). */
export type SubscriptionPlan = 'FREE' | 'SILVER' | 'GOLD';

/** Account-level status (PLAN_v2 Phase 9 — block/suspend). */
export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';

export type ListingStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SOLD';

/** Listing document (API / DynamoDB shape, PLAN_v2 §8). */
export type Listing = {
  listingId: string;
  userId: string;
  title: string;
  description: string;
  /** Parent category slug (Phase 14). Falls back to legacy free-text. */
  category: string;
  /** Subcategory slug (Phase 14). */
  subcategory?: string;
  /** Legacy free-text city OR city slug (Phase 14). */
  city: string;
  /** District slug (Phase 14). */
  district?: string;
  /** Province slug (Phase 14). */
  province?: string;
  price: number;
  /** Whether price is negotiable (Phase 16). */
  negotiable?: boolean;
  /** Item condition (Phase 14). */
  condition?: 'new' | 'used' | 'reconditioned';
  /** View count (Phase 16). */
  views?: number;
  status: ListingStatus;
  imageKeys: string[];
  isFeatured: boolean;
  /** Active promotion type if any (Phase 17). */
  activePromotion?: PromotionType;
  visibilityTier: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

/** Stored on user profile (PLAN_v2 — users / subscriptions). */
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PAST_DUE';

/** Safe user shape for API responses (no secrets). */
export type PublicUser = {
  userId: string;
  email: string;
  name: string;
  /** Optional phone; revealed on listings only per viewer plan (PLAN_v2 §7). */
  phone?: string;
  role: UserRole;
  accountStatus?: UserAccountStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartAt?: string;
  subscriptionEndAt?: string;
  createdAt: string;
  updatedAt: string;
};

/** Seller fields returned with listing detail (PLAN_v2 Phase 6 — visibility). */
export type ListingSellerSnapshot = {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
};

/** GET /listings/:id public response (masked by viewer subscription). */
export type ListingDetailResponse = {
  listing: Listing;
  seller: ListingSellerSnapshot | null;
  viewer: { subscriptionPlan: SubscriptionPlan };
};

/** Favorite record (PLAN_v2 §8 — favorites). */
export type Favorite = {
  userId: string;
  listingId: string;
  createdAt: string;
};

/** Inquiry record (PLAN_v2 §8 — inquiries). */
export type Inquiry = {
  inquiryId: string;
  listingId: string;
  buyerUserId: string;
  message: string;
  createdAt: string;
};

/** Single row in GET /listings/search (or GET /search). */
export type ListingSearchHit = {
  listingId: string;
  userId: string;
  title: string;
  category: string;
  subcategory?: string;
  city: string;
  district?: string;
  province?: string;
  price: number;
  negotiable?: boolean;
  condition?: 'new' | 'used' | 'reconditioned';
  views?: number;
  activePromotion?: PromotionType;
  imageKeys: string[];
  publishedAt?: string;
  createdAt: string;
  sellerName: string;
};

/** Report record (PLAN_v2 Phase 9 — reporting system). */
export type Report = {
  reportId: string;
  listingId: string;
  reporterUserId: string;
  reason: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
};

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED';

/** Notification record (PLAN_v2 Phase 10 — async notifications). */
export type Notification = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkTo?: string;
  read: boolean;
  createdAt: string;
};

export type NotificationType =
  | 'INQUIRY_RECEIVED'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'LISTING_REPORTED'
  | 'NEW_MESSAGE';

/** Public seller profile response (Phase 16). */
export type SellerProfile = {
  userId: string;
  name: string;
  memberSince: string;
  totalActiveListings: number;
};

// ── Phase 17 — Ad Promotion & Monetization ──────────────────────

export type PromotionType = 'BUMP' | 'FEATURED' | 'TOP_AD';

export type PromotionStatus = 'ACTIVE' | 'EXPIRED';

/** A purchased promotion for a listing (Phase 17). */
export type Promotion = {
  promotionId: string;
  listingId: string;
  userId: string;
  type: PromotionType;
  status: PromotionStatus;
  priceRs: number;
  startAt: string;
  expiresAt: string;
  createdAt: string;
};

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type PaymentPurpose = 'PROMOTION' | 'SUBSCRIPTION_UPGRADE';

/** Payment record (Phase 17 — Stripe integration Phase 20). */
export type Payment = {
  paymentId: string;
  userId: string;
  purpose: PaymentPurpose;
  /** e.g. promotionId or subscriptionPlan */
  referenceId: string;
  amountRs: number;
  status: PaymentStatus;
  method: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  /** Stripe PaymentIntent ID (set when using Stripe). */
  stripePaymentIntentId?: string;
};

/** Promotion plan option shown to user (Phase 17). */
export type PromotionPlan = {
  type: PromotionType;
  label: string;
  description: string;
  priceRs: number;
  durationDays: number;
};

/** Subscription upgrade plan shown to user (Phase 17). */
export type SubscriptionUpgradePlan = {
  plan: SubscriptionPlan;
  label: string;
  priceRs: number;
  period: string;
  features: string[];
};

/** Conversation between buyer and seller about a listing (Phase 15). */
export type Conversation = {
  conversationId: string;
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  lastMessageAt: string;
  lastMessageBody: string;
  buyerUnread: number;
  sellerUnread: number;
  blockedBy?: string;
  createdAt: string;
};

/** A single chat message within a conversation (Phase 15). */
export type Message = {
  conversationId: string;
  messageId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  readAt?: string;
};

/** Conversation list item with resolved names (Phase 15). */
export type ConversationListItem = Conversation & {
  otherUserName: string;
  listingTitle: string;
  listingImageKey?: string;
};
