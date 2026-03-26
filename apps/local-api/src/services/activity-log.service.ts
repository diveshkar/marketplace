import { randomUUID } from 'node:crypto';
import {
  activityLogRepository,
  type ActivityLog,
} from '../repositories/activity-log.repository.js';

export type LogAction = {
  adminUserId: string;
  adminName: string;
  action: string;
  targetType: ActivityLog['targetType'];
  targetId: string;
  details: string;
};

async function log(input: LogAction): Promise<void> {
  const entry: ActivityLog = {
    logId: randomUUID(),
    adminUserId: input.adminUserId,
    adminName: input.adminName,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    details: input.details,
    createdAt: new Date().toISOString(),
  };
  await activityLogRepository.create(entry);
}

async function listAll(): Promise<ActivityLog[]> {
  return activityLogRepository.listAll();
}

async function listByAdmin(adminUserId: string): Promise<ActivityLog[]> {
  return activityLogRepository.listByAdmin(adminUserId);
}

export const activityLogService = { log, listAll, listByAdmin };
