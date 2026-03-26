import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { requireActive } from '../middleware/require-active.js';
import { ConversationServiceError, conversationService } from '../services/conversation.service.js';

export const conversationsRouter = Router();

function handleError(err: unknown, next: NextFunction): void {
  if (err instanceof ConversationServiceError) {
    next(err);
    return;
  }
  next(err);
}

const startBody = z.object({
  message: z.string().min(1).max(2000),
});

const sendBody = z.object({
  body: z.string().min(1).max(2000),
});

/** POST /listings/:listingId/chat — start or resume conversation */
conversationsRouter.post(
  '/listings/:listingId/chat',
  requireAuth,
  requireActive,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = startBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const result = await conversationService.startOrGet(
        req.auth!.userId,
        req.params.listingId,
        parsed.data.message
      );
      res.status(201).json(result);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** GET /me/conversations — list all conversations */
conversationsRouter.get(
  '/me/conversations',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await conversationService.listForUser(req.auth!.userId);
      res.json(items);
    } catch (e) {
      next(e);
    }
  }
);

/** GET /me/conversations/unread-count */
conversationsRouter.get(
  '/me/conversations/unread-count',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await conversationService.getUnreadCount(req.auth!.userId);
      res.json({ count });
    } catch (e) {
      next(e);
    }
  }
);

/** GET /conversations/:conversationId — get conversation details */
conversationsRouter.get(
  '/conversations/:conversationId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conv = await conversationService.getConversation(
        req.auth!.userId,
        req.params.conversationId
      );
      res.json(conv);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** GET /conversations/:conversationId/messages */
conversationsRouter.get(
  '/conversations/:conversationId/messages',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await conversationService.getMessages(
        req.auth!.userId,
        req.params.conversationId
      );
      res.json(messages);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /conversations/:conversationId/messages — send message */
conversationsRouter.post(
  '/conversations/:conversationId/messages',
  requireAuth,
  requireActive,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = sendBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
        return;
      }
      const msg = await conversationService.sendMessage(
        req.auth!.userId,
        req.params.conversationId,
        parsed.data.body
      );
      res.status(201).json(msg);
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /conversations/:conversationId/read — mark as read */
conversationsRouter.post(
  '/conversations/:conversationId/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await conversationService.markRead(req.auth!.userId, req.params.conversationId);
      res.status(204).send();
    } catch (e) {
      handleError(e, next);
    }
  }
);

/** POST /conversations/:conversationId/block — toggle block */
conversationsRouter.post(
  '/conversations/:conversationId/block',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await conversationService.toggleBlock(
        req.auth!.userId,
        req.params.conversationId
      );
      res.json(result);
    } catch (e) {
      handleError(e, next);
    }
  }
);
