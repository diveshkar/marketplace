import { randomUUID } from 'node:crypto';
import { canSendInquiry, maxDailyInquiriesForPlan } from '@marketplace/shared-subscriptions';
import type { Inquiry, SubscriptionPlan } from '@marketplace/shared-types';
import { eventBus } from '../events/event-bus.js';
import { inquiryRepository } from '../repositories/inquiry.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export class InquiryServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'InquiryServiceError';
  }
}

function todayDatePrefix(): string {
  return new Date().toISOString().slice(0, 10);
}

export const inquiryService = {
  async send(
    buyerUserId: string,
    listingId: string,
    message: string,
    buyerPlan: SubscriptionPlan
  ): Promise<Inquiry> {
    const listing = await listingRepository.getById(listingId);
    if (!listing || listing.status !== 'ACTIVE') {
      throw new InquiryServiceError('Listing not found or not active', 404, 'LISTING_NOT_FOUND');
    }
    if (listing.userId === buyerUserId) {
      throw new InquiryServiceError('Cannot inquire on your own listing', 400, 'OWN_LISTING');
    }

    const todayCount = await inquiryRepository.countByBuyerOnDate(buyerUserId, todayDatePrefix());
    if (!canSendInquiry(buyerPlan, todayCount)) {
      throw new InquiryServiceError(
        `Daily inquiry limit reached for ${buyerPlan} (max ${maxDailyInquiriesForPlan(buyerPlan)}/day)`,
        429,
        'INQUIRY_LIMIT'
      );
    }

    const now = new Date().toISOString();
    const inquiry: Inquiry = {
      inquiryId: randomUUID(),
      listingId,
      buyerUserId,
      message,
      createdAt: now,
    };
    await inquiryRepository.create(inquiry);

    // Async: notify seller about new inquiry
    const buyer = await userRepository.getById(buyerUserId);
    eventBus.emit({
      type: 'INQUIRY_SENT',
      payload: {
        inquiryId: inquiry.inquiryId,
        listingId,
        listingTitle: listing.title,
        sellerUserId: listing.userId,
        buyerUserId,
        buyerName: buyer?.name ?? 'Unknown',
      },
    });

    return inquiry;
  },

  async listMine(buyerUserId: string): Promise<Inquiry[]> {
    const rows = await inquiryRepository.listByBuyer(buyerUserId);
    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return rows;
  },

  async listForListing(listingId: string): Promise<Inquiry[]> {
    const rows = await inquiryRepository.listByListing(listingId);
    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return rows;
  },

  async listSellerInbox(sellerUserId: string): Promise<
    (Inquiry & { listingTitle: string; buyerName: string })[]
  > {
    const listings = await listingRepository.listByUserId(sellerUserId);
    const allInquiries: (Inquiry & { listingTitle: string; buyerName: string })[] = [];
    for (const listing of listings) {
      const inquiries = await inquiryRepository.listByListing(listing.listingId);
      for (const inq of inquiries) {
        const buyer = await userRepository.getById(inq.buyerUserId);
        allInquiries.push({
          ...inq,
          listingTitle: listing.title,
          buyerName: buyer?.name ?? 'Unknown',
        });
      }
    }
    allInquiries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return allInquiries;
  },
};
