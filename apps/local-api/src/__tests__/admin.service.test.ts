import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock repositories ────────────────────────────────────────────

const mockListingRepo = {
  scanAll: vi.fn(),
  getById: vi.fn(),
  transitionStatusAdmin: vi.fn(),
  listByUserId: vi.fn(),
};

const mockUserRepo = {
  scanAll: vi.fn(),
  getById: vi.fn(),
  updateAccountStatus: vi.fn(),
};

const mockReportRepo = {
  scanAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
};

const mockPaymentRepo = {
  listAll: vi.fn(),
  listByUser: vi.fn(),
};

const mockEventBus = { emit: vi.fn() };

vi.mock('../repositories/listing.repository.js', () => ({
  listingRepository: mockListingRepo,
}));
vi.mock('../repositories/user.repository.js', () => ({
  userRepository: mockUserRepo,
}));
vi.mock('../repositories/report.repository.js', () => ({
  reportRepository: mockReportRepo,
}));
vi.mock('../repositories/payment.repository.js', () => ({
  paymentRepository: mockPaymentRepo,
}));
vi.mock('../events/event-bus.js', () => ({
  eventBus: mockEventBus,
}));

// Import after mocks
const { adminService } = await import('../services/admin.service.js');

// ── Helpers ──────────────────────────────────────────────────────

function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    listingId: 'lst-1',
    userId: 'user-1',
    title: 'Test Item',
    description: 'A test listing',
    category: 'electronics',
    city: 'colombo',
    price: 5000,
    status: 'PENDING',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'USER',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    reportId: 'rpt-1',
    listingId: 'lst-1',
    reporterUserId: 'user-2',
    reason: 'Spam listing',
    status: 'OPEN',
    createdAt: '2026-01-20T00:00:00.000Z',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('adminService.listPendingListings', () => {
  it('returns only PENDING listings sorted by createdAt asc', async () => {
    const pending1 = makeListing({ listingId: 'p1', status: 'PENDING', createdAt: '2026-01-10T00:00:00Z' });
    const pending2 = makeListing({ listingId: 'p2', status: 'PENDING', createdAt: '2026-01-05T00:00:00Z' });
    const active = makeListing({ listingId: 'a1', status: 'ACTIVE' });
    mockListingRepo.scanAll.mockResolvedValue([pending1, active, pending2]);

    const result = await adminService.listPendingListings();
    expect(result).toHaveLength(2);
    expect(result[0].listingId).toBe('p2');
    expect(result[1].listingId).toBe('p1');
  });

  it('returns empty array when no pending listings', async () => {
    mockListingRepo.scanAll.mockResolvedValue([makeListing({ status: 'ACTIVE' })]);
    const result = await adminService.listPendingListings();
    expect(result).toHaveLength(0);
  });
});

describe('adminService.searchListings', () => {
  it('filters by status', async () => {
    mockListingRepo.scanAll.mockResolvedValue([
      makeListing({ listingId: '1', status: 'ACTIVE' }),
      makeListing({ listingId: '2', status: 'PENDING' }),
    ]);
    const result = await adminService.searchListings({ status: 'ACTIVE' });
    expect(result).toHaveLength(1);
    expect(result[0].listingId).toBe('1');
  });

  it('filters by category (case-insensitive)', async () => {
    mockListingRepo.scanAll.mockResolvedValue([
      makeListing({ listingId: '1', category: 'Electronics' }),
      makeListing({ listingId: '2', category: 'vehicles' }),
    ]);
    const result = await adminService.searchListings({ category: 'electronics' });
    expect(result).toHaveLength(1);
    expect(result[0].listingId).toBe('1');
  });

  it('filters by text query in title/description', async () => {
    mockListingRepo.scanAll.mockResolvedValue([
      makeListing({ listingId: '1', title: 'iPhone 15 Pro', description: 'Brand new' }),
      makeListing({ listingId: '2', title: 'Samsung TV', description: 'Used' }),
    ]);
    const result = await adminService.searchListings({ q: 'iphone' });
    expect(result).toHaveLength(1);
    expect(result[0].listingId).toBe('1');
  });

  it('applies multiple filters together', async () => {
    mockListingRepo.scanAll.mockResolvedValue([
      makeListing({ listingId: '1', status: 'ACTIVE', category: 'electronics', title: 'Phone' }),
      makeListing({ listingId: '2', status: 'ACTIVE', category: 'vehicles', title: 'Car' }),
      makeListing({ listingId: '3', status: 'PENDING', category: 'electronics', title: 'Laptop' }),
    ]);
    const result = await adminService.searchListings({ status: 'ACTIVE', category: 'electronics' });
    expect(result).toHaveLength(1);
    expect(result[0].listingId).toBe('1');
  });
});

describe('adminService.approveListing', () => {
  it('approves a PENDING listing and emits event', async () => {
    mockListingRepo.getById.mockResolvedValue(makeListing({ status: 'PENDING' }));
    mockListingRepo.transitionStatusAdmin.mockResolvedValue(undefined);

    await adminService.approveListing('lst-1');

    expect(mockListingRepo.transitionStatusAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ listingId: 'lst-1', from: 'PENDING', to: 'ACTIVE' })
    );
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LISTING_APPROVED' })
    );
  });

  it('throws when listing not found', async () => {
    mockListingRepo.getById.mockResolvedValue(null);
    await expect(adminService.approveListing('nope')).rejects.toThrow('Listing not found');
  });

  it('throws when listing is not PENDING', async () => {
    mockListingRepo.getById.mockResolvedValue(makeListing({ status: 'ACTIVE' }));
    await expect(adminService.approveListing('lst-1')).rejects.toThrow('Cannot approve');
  });
});

describe('adminService.rejectListing', () => {
  it('rejects a PENDING listing and emits event', async () => {
    mockListingRepo.getById.mockResolvedValue(makeListing({ status: 'PENDING' }));
    mockListingRepo.transitionStatusAdmin.mockResolvedValue(undefined);

    await adminService.rejectListing('lst-1');

    expect(mockListingRepo.transitionStatusAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ listingId: 'lst-1', from: 'PENDING', to: 'REJECTED' })
    );
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LISTING_REJECTED' })
    );
  });

  it('throws when listing not found', async () => {
    mockListingRepo.getById.mockResolvedValue(null);
    await expect(adminService.rejectListing('nope')).rejects.toThrow('Listing not found');
  });
});

describe('adminService.bulkModerateListings', () => {
  it('approves multiple listings and returns counts', async () => {
    mockListingRepo.getById.mockResolvedValue(makeListing({ status: 'PENDING' }));
    mockListingRepo.transitionStatusAdmin.mockResolvedValue(undefined);

    const result = await adminService.bulkModerateListings(['lst-1', 'lst-2', 'lst-3'], 'approve');
    expect(result.success).toBe(3);
    expect(result.failed).toBe(0);
  });

  it('counts failures when some listings fail', async () => {
    mockListingRepo.getById
      .mockResolvedValueOnce(makeListing({ status: 'PENDING' }))
      .mockResolvedValueOnce(null) // not found
      .mockResolvedValueOnce(makeListing({ status: 'ACTIVE' })); // wrong status
    mockListingRepo.transitionStatusAdmin.mockResolvedValue(undefined);

    const result = await adminService.bulkModerateListings(['lst-1', 'lst-2', 'lst-3'], 'approve');
    expect(result.success).toBe(1);
    expect(result.failed).toBe(2);
  });
});

describe('adminService.searchUsers', () => {
  it('filters by plan', async () => {
    mockUserRepo.scanAll.mockResolvedValue([
      makeUser({ userId: '1', subscriptionPlan: 'FREE' }),
      makeUser({ userId: '2', subscriptionPlan: 'GOLD' }),
    ]);
    const result = await adminService.searchUsers({ plan: 'GOLD' });
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('2');
  });

  it('filters by name/email text query', async () => {
    mockUserRepo.scanAll.mockResolvedValue([
      makeUser({ userId: '1', name: 'Alice', email: 'alice@test.com' }),
      makeUser({ userId: '2', name: 'Bob', email: 'bob@test.com' }),
    ]);
    const result = await adminService.searchUsers({ q: 'alice' });
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('1');
  });

  it('filters by role', async () => {
    mockUserRepo.scanAll.mockResolvedValue([
      makeUser({ userId: '1', role: 'USER' }),
      makeUser({ userId: '2', role: 'ADMIN' }),
    ]);
    const result = await adminService.searchUsers({ role: 'ADMIN' });
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('2');
  });
});

describe('adminService.getUserDetail', () => {
  it('returns user with listings and payments', async () => {
    mockUserRepo.getById.mockResolvedValue(makeUser());
    mockListingRepo.listByUserId.mockResolvedValue([makeListing()]);
    mockPaymentRepo.listByUser.mockResolvedValue([
      { paymentId: 'pay-1', amountRs: 500, purpose: 'PROMOTION', description: 'Featured', createdAt: '2026-01-20T00:00:00Z' },
    ]);

    const result = await adminService.getUserDetail('user-1');
    expect(result.user.userId).toBe('user-1');
    expect(result.listings).toHaveLength(1);
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].amountRs).toBe(500);
  });

  it('throws when user not found', async () => {
    mockUserRepo.getById.mockResolvedValue(null);
    await expect(adminService.getUserDetail('nope')).rejects.toThrow('User not found');
  });
});

describe('adminService.setAccountStatus', () => {
  it('updates user account status', async () => {
    const user = makeUser();
    mockUserRepo.getById.mockResolvedValue(user);
    mockUserRepo.updateAccountStatus.mockResolvedValue({ ...user, accountStatus: 'SUSPENDED' });

    const result = await adminService.setAccountStatus('user-1', 'SUSPENDED');
    expect(result.accountStatus).toBe('SUSPENDED');
    expect(mockUserRepo.updateAccountStatus).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', accountStatus: 'SUSPENDED' })
    );
  });

  it('throws when user not found', async () => {
    mockUserRepo.getById.mockResolvedValue(null);
    await expect(adminService.setAccountStatus('nope', 'BLOCKED')).rejects.toThrow('User not found');
  });
});

describe('adminService.bulkSetUserStatus', () => {
  it('updates multiple users and returns counts', async () => {
    const user = makeUser();
    mockUserRepo.getById.mockResolvedValue(user);
    mockUserRepo.updateAccountStatus.mockResolvedValue({ ...user, accountStatus: 'SUSPENDED' });

    const result = await adminService.bulkSetUserStatus(['u1', 'u2'], 'SUSPENDED');
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
  });
});

describe('adminService.createReport', () => {
  it('creates a report and emits event', async () => {
    mockListingRepo.getById.mockResolvedValue(makeListing());
    mockReportRepo.create.mockResolvedValue(undefined);

    const result = await adminService.createReport({
      listingId: 'lst-1',
      reporterUserId: 'user-2',
      reason: 'Fake item',
    });

    expect(result.reportId).toBeTruthy();
    expect(result.status).toBe('OPEN');
    expect(result.reason).toBe('Fake item');
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LISTING_REPORTED' })
    );
  });

  it('throws when listing not found', async () => {
    mockListingRepo.getById.mockResolvedValue(null);
    await expect(
      adminService.createReport({ listingId: 'nope', reporterUserId: 'u1', reason: 'spam' })
    ).rejects.toThrow('Listing not found');
  });
});

describe('adminService.resolveReport', () => {
  it('marks report as REVIEWED', async () => {
    const report = makeReport();
    mockReportRepo.getById.mockResolvedValue(report);
    mockReportRepo.updateStatus.mockResolvedValue({ ...report, status: 'REVIEWED' });

    const result = await adminService.resolveReport('rpt-1', 'REVIEWED', 'admin-1');
    expect(result.status).toBe('REVIEWED');
  });

  it('throws when report not found', async () => {
    mockReportRepo.getById.mockResolvedValue(null);
    await expect(adminService.resolveReport('nope', 'DISMISSED', 'admin-1')).rejects.toThrow('Report not found');
  });
});

describe('adminService.getUsageStats', () => {
  it('returns aggregated stats', async () => {
    mockUserRepo.scanAll.mockResolvedValue([
      makeUser({ subscriptionPlan: 'FREE', createdAt: new Date().toISOString() }),
      makeUser({ subscriptionPlan: 'GOLD', createdAt: new Date().toISOString() }),
    ]);
    mockListingRepo.scanAll.mockResolvedValue([
      makeListing({ status: 'ACTIVE', createdAt: new Date().toISOString() }),
      makeListing({ status: 'PENDING', createdAt: new Date().toISOString() }),
    ]);
    mockReportRepo.scanAll.mockResolvedValue([makeReport({ status: 'OPEN' })]);
    mockPaymentRepo.listAll.mockResolvedValue([
      { amountRs: 500, status: 'COMPLETED', createdAt: new Date().toISOString() },
    ]);

    const stats = await adminService.getUsageStats();

    expect(stats.totalUsers).toBe(2);
    expect(stats.byPlan.FREE).toBe(1);
    expect(stats.byPlan.GOLD).toBe(1);
    expect(stats.totalListings).toBe(2);
    expect(stats.byStatus.ACTIVE).toBe(1);
    expect(stats.byStatus.PENDING).toBe(1);
    expect(stats.openReports).toBe(1);
    expect(stats.dailyUsers.length).toBeGreaterThan(0);
    expect(stats.revenue.length).toBeGreaterThan(0);
    expect(stats.revenue[0].amountRs).toBe(500);
  });

  it('handles empty data', async () => {
    mockUserRepo.scanAll.mockResolvedValue([]);
    mockListingRepo.scanAll.mockResolvedValue([]);
    mockReportRepo.scanAll.mockResolvedValue([]);
    mockPaymentRepo.listAll.mockResolvedValue([]);

    const stats = await adminService.getUsageStats();
    expect(stats.totalUsers).toBe(0);
    expect(stats.totalListings).toBe(0);
    expect(stats.openReports).toBe(0);
    expect(stats.dailyUsers).toHaveLength(0);
    expect(stats.revenue).toHaveLength(0);
  });
});
