import { EventEmitter } from 'node:events';

/**
 * Local in-process event bus (Phase 10 — async system).
 *
 * In cloud, these events would go to EventBridge or SQS.
 * Locally, we use a Node.js EventEmitter so workers run
 * in-process without needing external infrastructure.
 */

export type DomainEvent =
  | {
      type: 'INQUIRY_SENT';
      payload: {
        inquiryId: string;
        listingId: string;
        listingTitle: string;
        sellerUserId: string;
        buyerUserId: string;
        buyerName: string;
      };
    }
  | {
      type: 'LISTING_APPROVED';
      payload: {
        listingId: string;
        listingTitle: string;
        ownerUserId: string;
      };
    }
  | {
      type: 'LISTING_REJECTED';
      payload: {
        listingId: string;
        listingTitle: string;
        ownerUserId: string;
      };
    }
  | {
      type: 'LISTING_REPORTED';
      payload: {
        reportId: string;
        listingId: string;
        listingTitle: string;
        reporterUserId: string;
      };
    };

class LocalEventBus {
  private emitter = new EventEmitter();

  emit(event: DomainEvent): void {
    // Fire-and-forget — mirror async queue behavior
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);
  }

  on(type: DomainEvent['type'] | '*', handler: (event: DomainEvent) => void): void {
    this.emitter.on(type, handler);
  }
}

export const eventBus = new LocalEventBus();
