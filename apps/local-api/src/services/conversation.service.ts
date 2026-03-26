import { randomUUID } from 'node:crypto';
import type { Conversation, ConversationListItem, Message } from '@marketplace/shared-types';
import { conversationRepository } from '../repositories/conversation.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';

export class ConversationServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ConversationServiceError';
  }
}

function isParticipant(conv: Conversation, userId: string): boolean {
  return conv.buyerUserId === userId || conv.sellerUserId === userId;
}

export const conversationService = {
  /**
   * Start or resume a conversation about a listing.
   * Creates a new conversation if one doesn't exist between buyer and seller for this listing.
   */
  async startOrGet(
    buyerUserId: string,
    listingId: string,
    initialMessage: string
  ): Promise<{ conversation: Conversation; message: Message }> {
    const listing = await listingRepository.getById(listingId);
    if (!listing) {
      throw new ConversationServiceError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    if (listing.userId === buyerUserId) {
      throw new ConversationServiceError('Cannot message your own listing', 400, 'OWN_LISTING');
    }

    // Check if conversation already exists
    let conv = await conversationRepository.findByListingAndBuyer(listingId, buyerUserId);
    const now = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${randomUUID().slice(0, 8)}`;

    if (!conv) {
      conv = {
        conversationId: randomUUID(),
        listingId,
        buyerUserId,
        sellerUserId: listing.userId,
        lastMessageAt: now,
        lastMessageBody: initialMessage,
        buyerUnread: 0,
        sellerUnread: 1,
        createdAt: now,
      };
      await conversationRepository.create(conv);
    } else {
      await conversationRepository.updateLastMessage(conv.conversationId, initialMessage, now, true);
      conv.lastMessageAt = now;
      conv.lastMessageBody = initialMessage;
    }

    const message: Message = {
      conversationId: conv.conversationId,
      messageId,
      senderUserId: buyerUserId,
      body: initialMessage,
      createdAt: now,
    };
    await messageRepository.create(message);

    // Notify seller
    const buyer = await userRepository.getById(buyerUserId);
    await notificationRepository.create({
      notificationId: randomUUID(),
      userId: listing.userId,
      type: 'NEW_MESSAGE',
      title: 'New message',
      body: `${buyer?.name ?? 'Someone'} sent you a message about "${listing.title}"`,
      linkTo: `/me/messages?c=${conv.conversationId}`,
      read: false,
      createdAt: now,
    });

    return { conversation: conv, message };
  },

  /** Send a message in an existing conversation. */
  async sendMessage(
    userId: string,
    conversationId: string,
    body: string
  ): Promise<Message> {
    const conv = await conversationRepository.getById(conversationId);
    if (!conv) {
      throw new ConversationServiceError('Conversation not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(conv, userId)) {
      throw new ConversationServiceError('Forbidden', 403, 'NOT_PARTICIPANT');
    }
    if (conv.blockedBy) {
      throw new ConversationServiceError('This conversation has been blocked', 403, 'BLOCKED');
    }

    const now = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const isBuyer = conv.buyerUserId === userId;

    const message: Message = {
      conversationId,
      messageId,
      senderUserId: userId,
      body,
      createdAt: now,
    };
    await messageRepository.create(message);
    await conversationRepository.updateLastMessage(conversationId, body, now, isBuyer);

    // Notify the other party
    const recipientId = isBuyer ? conv.sellerUserId : conv.buyerUserId;
    const sender = await userRepository.getById(userId);
    const listing = await listingRepository.getById(conv.listingId);
    await notificationRepository.create({
      notificationId: randomUUID(),
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: 'New message',
      body: `${sender?.name ?? 'Someone'}: ${body.slice(0, 80)}${body.length > 80 ? '...' : ''}`,
      linkTo: `/me/messages?c=${conversationId}`,
      read: false,
      createdAt: now,
    });

    return message;
  },

  /** List all conversations for a user (as buyer or seller). */
  async listForUser(userId: string): Promise<ConversationListItem[]> {
    const [asBuyer, asSeller] = await Promise.all([
      conversationRepository.listByBuyer(userId),
      conversationRepository.listBySeller(userId),
    ]);

    // Deduplicate
    const map = new Map<string, Conversation>();
    for (const c of [...asBuyer, ...asSeller]) {
      map.set(c.conversationId, c);
    }
    const all = [...map.values()];
    all.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));

    // Resolve names and listing info
    const items: ConversationListItem[] = [];
    for (const conv of all) {
      const otherUserId = conv.buyerUserId === userId ? conv.sellerUserId : conv.buyerUserId;
      const [otherUser, listing] = await Promise.all([
        userRepository.getById(otherUserId),
        listingRepository.getById(conv.listingId),
      ]);
      items.push({
        ...conv,
        otherUserName: otherUser?.name ?? 'Unknown',
        listingTitle: listing?.title ?? 'Deleted listing',
        listingImageKey: listing?.imageKeys?.[0],
      });
    }
    return items;
  },

  /** Get messages for a conversation (must be participant). */
  async getMessages(userId: string, conversationId: string): Promise<Message[]> {
    const conv = await conversationRepository.getById(conversationId);
    if (!conv) {
      throw new ConversationServiceError('Conversation not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(conv, userId)) {
      throw new ConversationServiceError('Forbidden', 403, 'NOT_PARTICIPANT');
    }
    return messageRepository.listByConversation(conversationId);
  },

  /** Mark conversation as read for this user. */
  async markRead(userId: string, conversationId: string): Promise<void> {
    const conv = await conversationRepository.getById(conversationId);
    if (!conv) {
      throw new ConversationServiceError('Conversation not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(conv, userId)) {
      throw new ConversationServiceError('Forbidden', 403, 'NOT_PARTICIPANT');
    }
    const isBuyer = conv.buyerUserId === userId;
    await conversationRepository.clearUnread(conversationId, isBuyer);
  },

  /** Get total unread message count across all conversations. */
  async getUnreadCount(userId: string): Promise<number> {
    const [asBuyer, asSeller] = await Promise.all([
      conversationRepository.listByBuyer(userId),
      conversationRepository.listBySeller(userId),
    ]);
    let count = 0;
    const seen = new Set<string>();
    for (const c of [...asBuyer, ...asSeller]) {
      if (seen.has(c.conversationId)) continue;
      seen.add(c.conversationId);
      if (c.buyerUserId === userId) count += c.buyerUnread ?? 0;
      else count += c.sellerUnread ?? 0;
    }
    return count;
  },

  /** Block or unblock a conversation. */
  async toggleBlock(userId: string, conversationId: string): Promise<{ blocked: boolean }> {
    const conv = await conversationRepository.getById(conversationId);
    if (!conv) {
      throw new ConversationServiceError('Conversation not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(conv, userId)) {
      throw new ConversationServiceError('Forbidden', 403, 'NOT_PARTICIPANT');
    }
    if (conv.blockedBy === userId) {
      await conversationRepository.setBlockedBy(conversationId, undefined);
      return { blocked: false };
    }
    if (conv.blockedBy) {
      throw new ConversationServiceError('Conversation already blocked by other user', 400, 'ALREADY_BLOCKED');
    }
    await conversationRepository.setBlockedBy(conversationId, userId);
    return { blocked: true };
  },

  /** Get a single conversation (must be participant). */
  async getConversation(userId: string, conversationId: string): Promise<Conversation> {
    const conv = await conversationRepository.getById(conversationId);
    if (!conv) {
      throw new ConversationServiceError('Conversation not found', 404, 'NOT_FOUND');
    }
    if (!isParticipant(conv, userId)) {
      throw new ConversationServiceError('Forbidden', 403, 'NOT_PARTICIPANT');
    }
    return conv;
  },
};
