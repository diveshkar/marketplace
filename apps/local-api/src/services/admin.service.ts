import { randomUUID } from 'node:crypto';
import type { Listing, PublicUser, Report, ReportStatus, UserAccountStatus } from '@marketplace/shared-types';
import { eventBus } from '../events/event-bus.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';

export class AdminServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AdminServiceError';
  }
}

export const adminService = {
  // ── Listing moderation ─────────────────────────────────────────

  async listPendingListings(): Promise<Listing[]> {
    const all = await listingRepository.scanAll();
    return all
      .filter((l) => l.status === 'PENDING')
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },

  /** Search/filter all listings (admin view). */
  async searchListings(filters: {
    status?: string;
    category?: string;
    userId?: string;
    q?: string;
  }): Promise<Listing[]> {
    const all = await listingRepository.scanAll();
    let filtered = all;
    if (filters.status) filtered = filtered.filter((l) => l.status === filters.status);
    if (filters.category) filtered = filtered.filter((l) => l.category.toLowerCase() === filters.category!.toLowerCase());
    if (filters.userId) filtered = filtered.filter((l) => l.userId === filters.userId);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      filtered = filtered.filter((l) => `${l.title} ${l.description}`.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async approveListing(listingId: string): Promise<void> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new AdminServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    if (listing.status !== 'PENDING') {
      throw new AdminServiceError(
        `Cannot approve listing in ${listing.status} status`,
        400,
        'INVALID_STATUS'
      );
    }
    const now = new Date().toISOString();
    await listingRepository.transitionStatusAdmin({
      listingId,
      from: 'PENDING',
      to: 'ACTIVE',
      now,
      publishedAt: now,
    });

    eventBus.emit({
      type: 'LISTING_APPROVED',
      payload: { listingId, listingTitle: listing.title, ownerUserId: listing.userId },
    });
  },

  async rejectListing(listingId: string): Promise<void> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new AdminServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    if (listing.status !== 'PENDING') {
      throw new AdminServiceError(
        `Cannot reject listing in ${listing.status} status`,
        400,
        'INVALID_STATUS'
      );
    }
    const now = new Date().toISOString();
    await listingRepository.transitionStatusAdmin({
      listingId,
      from: 'PENDING',
      to: 'REJECTED',
      now,
    });

    eventBus.emit({
      type: 'LISTING_REJECTED',
      payload: { listingId, listingTitle: listing.title, ownerUserId: listing.userId },
    });
  },

  /** Bulk approve/reject pending listings. Returns count of actioned items. */
  async bulkModerateListings(
    listingIds: string[],
    action: 'approve' | 'reject'
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const id of listingIds) {
      try {
        if (action === 'approve') await this.approveListing(id);
        else await this.rejectListing(id);
        success++;
      } catch {
        failed++;
      }
    }
    return { success, failed };
  },

  // ── User management ────────────────────────────────────────────

  async listUsers(): Promise<PublicUser[]> {
    const users = await userRepository.scanAll();
    return users.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },

  /** Search/filter users. */
  async searchUsers(filters: {
    q?: string;
    plan?: string;
    status?: string;
    role?: string;
  }): Promise<PublicUser[]> {
    const all = await userRepository.scanAll();
    let filtered = all;
    if (filters.plan) filtered = filtered.filter((u) => u.subscriptionPlan === filters.plan);
    if (filters.status) filtered = filtered.filter((u) => (u.accountStatus ?? 'ACTIVE') === filters.status);
    if (filters.role) filtered = filtered.filter((u) => u.role === filters.role);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      filtered = filtered.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** Get user detail with their listings, reports, and payments. */
  async getUserDetail(userId: string): Promise<{
    user: PublicUser;
    listings: Listing[];
    payments: { paymentId: string; amountRs: number; purpose: string; description: string; createdAt: string }[];
  }> {
    const user = await userRepository.getById(userId);
    if (!user) throw new AdminServiceError('User not found', 404, 'USER_NOT_FOUND');
    const listings = await listingRepository.listByUserId(userId);
    const payments = await paymentRepository.listByUser(userId);
    return {
      user,
      listings: listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      payments: payments.map((p) => ({
        paymentId: p.paymentId,
        amountRs: p.amountRs,
        purpose: p.purpose,
        description: p.description,
        createdAt: p.createdAt,
      })),
    };
  },

  async setAccountStatus(
    targetUserId: string,
    accountStatus: UserAccountStatus
  ): Promise<PublicUser> {
    const user = await userRepository.getById(targetUserId);
    if (!user) {
      throw new AdminServiceError('User not found', 404, 'USER_NOT_FOUND');
    }
    const now = new Date().toISOString();
    const updated = await userRepository.updateAccountStatus({
      userId: targetUserId,
      accountStatus,
      now,
    });
    if (!updated) {
      throw new AdminServiceError('Update failed', 500, 'UPDATE_FAILED');
    }
    return updated;
  },

  /** Bulk update user status. */
  async bulkSetUserStatus(
    userIds: string[],
    accountStatus: UserAccountStatus
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const id of userIds) {
      try {
        await this.setAccountStatus(id, accountStatus);
        success++;
      } catch {
        failed++;
      }
    }
    return { success, failed };
  },

  // ── Reports ────────────────────────────────────────────────────

  async createReport(input: {
    listingId: string;
    reporterUserId: string;
    reason: string;
  }): Promise<Report> {
    const listing = await listingRepository.getById(input.listingId);
    if (!listing) {
      throw new AdminServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    const now = new Date().toISOString();
    const report: Report = {
      reportId: randomUUID(),
      listingId: input.listingId,
      reporterUserId: input.reporterUserId,
      reason: input.reason,
      status: 'OPEN',
      createdAt: now,
    };
    await reportRepository.create(report);

    eventBus.emit({
      type: 'LISTING_REPORTED',
      payload: {
        reportId: report.reportId,
        listingId: input.listingId,
        listingTitle: listing.title,
        reporterUserId: input.reporterUserId,
      },
    });

    return report;
  },

  async listReports(): Promise<Report[]> {
    const reports = await reportRepository.scanAll();
    return reports.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async resolveReport(
    reportId: string,
    status: ReportStatus,
    adminUserId: string
  ): Promise<Report> {
    const report = await reportRepository.getById(reportId);
    if (!report) {
      throw new AdminServiceError('Report not found', 404, 'REPORT_NOT_FOUND');
    }
    const now = new Date().toISOString();
    const updated = await reportRepository.updateStatus({
      reportId,
      status,
      resolvedBy: adminUserId,
      now,
    });
    if (!updated) {
      throw new AdminServiceError('Update failed', 500, 'UPDATE_FAILED');
    }
    return updated;
  },

  // ── Usage stats (enhanced with daily data for charts) ─────────

  async getUsageStats(): Promise<{
    totalUsers: number;
    byPlan: Record<string, number>;
    totalListings: number;
    byStatus: Record<string, number>;
    openReports: number;
    dailyUsers: { date: string; count: number }[];
    dailyListings: { date: string; count: number }[];
    revenue: { date: string; amountRs: number }[];
  }> {
    const [users, listings, reports, payments] = await Promise.all([
      userRepository.scanAll(),
      listingRepository.scanAll(),
      reportRepository.scanAll(),
      paymentRepository.listAll(),
    ]);

    const byPlan: Record<string, number> = { FREE: 0, SILVER: 0, GOLD: 0 };
    for (const u of users) {
      byPlan[u.subscriptionPlan] = (byPlan[u.subscriptionPlan] ?? 0) + 1;
    }

    const byStatus: Record<string, number> = {};
    for (const l of listings) {
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    }

    const openReports = reports.filter((r) => r.status === 'OPEN').length;

    // Daily aggregations (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyUsers = aggregateByDay(
      users.map((u) => u.createdAt),
      thirtyDaysAgo
    );
    const dailyListings = aggregateByDay(
      listings.map((l) => l.createdAt),
      thirtyDaysAgo
    );
    const revenue = aggregateRevenueByDay(payments, thirtyDaysAgo);

    return {
      totalUsers: users.length,
      byPlan,
      totalListings: listings.length,
      byStatus,
      openReports,
      dailyUsers,
      dailyListings,
      revenue,
    };
  },
};

function aggregateByDay(
  dates: string[],
  since: Date
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const d of dates) {
    const day = d.slice(0, 10);
    if (new Date(day) >= since) {
      map.set(day, (map.get(day) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateRevenueByDay(
  payments: { amountRs: number; status: string; createdAt: string }[],
  since: Date
): { date: string; amountRs: number }[] {
  const map = new Map<string, number>();
  for (const p of payments) {
    if (p.status !== 'COMPLETED') continue;
    const day = p.createdAt.slice(0, 10);
    if (new Date(day) >= since) {
      map.set(day, (map.get(day) ?? 0) + p.amountRs);
    }
  }
  return [...map.entries()]
    .map(([date, amountRs]) => ({ date, amountRs }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
