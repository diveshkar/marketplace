import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock repository ──────────────────────────────────────────────

const mockRepo = {
  create: vi.fn(),
  listAll: vi.fn(),
  listByAdmin: vi.fn(),
};

vi.mock('../repositories/activity-log.repository.js', () => ({
  activityLogRepository: mockRepo,
}));

const { activityLogService } = await import('../services/activity-log.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('activityLogService.log', () => {
  it('creates an activity log entry with generated logId and timestamp', async () => {
    mockRepo.create.mockResolvedValue(undefined);

    await activityLogService.log({
      adminUserId: 'admin-1',
      adminName: 'admin@test.com',
      action: 'APPROVE_LISTING',
      targetType: 'LISTING',
      targetId: 'lst-1',
      details: 'Approved listing',
    });

    expect(mockRepo.create).toHaveBeenCalledOnce();
    const entry = mockRepo.create.mock.calls[0][0];
    expect(entry.logId).toBeTruthy();
    expect(entry.adminUserId).toBe('admin-1');
    expect(entry.adminName).toBe('admin@test.com');
    expect(entry.action).toBe('APPROVE_LISTING');
    expect(entry.targetType).toBe('LISTING');
    expect(entry.targetId).toBe('lst-1');
    expect(entry.createdAt).toBeTruthy();
  });
});

describe('activityLogService.listAll', () => {
  it('returns all logs from repository', async () => {
    const logs = [
      {
        logId: 'log-1',
        adminUserId: 'admin-1',
        adminName: 'admin@test.com',
        action: 'APPROVE_LISTING',
        targetType: 'LISTING',
        targetId: 'lst-1',
        details: 'Approved listing',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    mockRepo.listAll.mockResolvedValue(logs);

    const result = await activityLogService.listAll();
    expect(result).toHaveLength(1);
    expect(result[0].logId).toBe('log-1');
  });
});

describe('activityLogService.listByAdmin', () => {
  it('queries logs by admin user ID', async () => {
    mockRepo.listByAdmin.mockResolvedValue([]);

    const result = await activityLogService.listByAdmin('admin-1');
    expect(result).toHaveLength(0);
    expect(mockRepo.listByAdmin).toHaveBeenCalledWith('admin-1');
  });
});
