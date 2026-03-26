import { randomUUID } from 'node:crypto';
import type { Notification, NotificationType } from '@marketplace/shared-types';
import type { DomainEvent } from '../events/event-bus.js';
import { eventBus } from '../events/event-bus.js';
import { notificationRepository } from '../repositories/notification.repository.js';

/**
 * Notification worker (Phase 10 — async system).
 *
 * Listens to domain events and writes user notifications.
 * In cloud this would be a Lambda triggered by SQS/EventBridge.
 * Locally it runs in-process via the event bus.
 */

async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  linkTo?: string
): Promise<void> {
  const notification: Notification = {
    notificationId: randomUUID(),
    userId,
    type,
    title,
    body,
    linkTo,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await notificationRepository.create(notification);
}

function handleEvent(event: DomainEvent): void {
  // Fire-and-forget: log errors but don't crash the process
  processEvent(event).catch((err) => {
    console.error(`[notification-worker] Failed to process ${event.type}:`, err);
  });
}

async function processEvent(event: DomainEvent): Promise<void> {
  switch (event.type) {
    case 'INQUIRY_SENT': {
      const p = event.payload;
      await createNotification(
        p.sellerUserId,
        'INQUIRY_RECEIVED',
        'New inquiry on your listing',
        `${p.buyerName} sent an inquiry on "${p.listingTitle}"`,
        `/listings/${p.listingId}`
      );
      console.log(`[notification-worker] Notified seller ${p.sellerUserId} about inquiry`);
      break;
    }
    case 'LISTING_APPROVED': {
      const p = event.payload;
      await createNotification(
        p.ownerUserId,
        'LISTING_APPROVED',
        'Listing approved',
        `Your listing "${p.listingTitle}" has been approved and is now live.`,
        `/listings/${p.listingId}`
      );
      console.log(`[notification-worker] Notified owner ${p.ownerUserId} about approval`);
      break;
    }
    case 'LISTING_REJECTED': {
      const p = event.payload;
      await createNotification(
        p.ownerUserId,
        'LISTING_REJECTED',
        'Listing rejected',
        `Your listing "${p.listingTitle}" was rejected by a moderator.`,
        `/listings/${p.listingId}`
      );
      console.log(`[notification-worker] Notified owner ${p.ownerUserId} about rejection`);
      break;
    }
    case 'LISTING_REPORTED': {
      // Notify admins — in MVP we don't know admin userIds at event time,
      // so just log it. Admin sees reports in the admin panel.
      console.log(
        `[notification-worker] Report ${event.payload.reportId} on listing ${event.payload.listingId} — admin notified via panel`
      );
      break;
    }
  }
}

export function startNotificationWorker(): void {
  eventBus.on('*', handleEvent);
  console.log('[notification-worker] Listening for domain events');
}
