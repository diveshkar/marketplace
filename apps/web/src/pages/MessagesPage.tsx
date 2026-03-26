import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ConversationListItem, Message } from '@marketplace/shared-types';
import { useAuth } from '../auth/use-auth';
import { apiFetch } from '../lib/api-client';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { useToast } from '../components/ui/Toast';
import { PageHead } from '../components/seo/PageHead';

export function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationListItem[] | null>(null);
  const paramC = searchParams.get('c');
  const [activeConvId, setActiveConvId] = useState<string | null>(paramC && paramC !== 'undefined' ? paramC : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const activeConv = conversations?.find((c) => c.conversationId === activeConvId) ?? null;

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await apiFetch('/me/conversations');
      if (res.ok) setConversations((await res.json()) as ConversationListItem[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await apiFetch(`/conversations/${convId}/messages`);
      if (res.ok) {
        setMessages((await res.json()) as Message[]);
        // Mark as read
        await apiFetch(`/conversations/${convId}/read`, { method: 'POST' });
        // Refresh conversations to update unread counts
        loadConversations();
      }
    } catch { /* ignore */ }
    setLoadingMsgs(false);
  }, [loadConversations]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, loadMessages]);

  // Poll for new messages every 10s
  useEffect(() => {
    if (!activeConvId) return;
    pollRef.current = setInterval(() => {
      loadMessages(activeConvId);
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [activeConvId, loadMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function selectConversation(convId: string) {
    setActiveConvId(convId);
    setSearchParams({ c: convId });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConvId || !msgInput.trim()) return;
    setSendBusy(true);
    try {
      const res = await apiFetch(`/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: msgInput.trim() }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || 'Send failed');
      }
      setMsgInput('');
      await loadMessages(activeConvId);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Send failed', 'error');
    } finally {
      setSendBusy(false);
    }
  }

  async function toggleBlock() {
    if (!activeConvId) return;
    try {
      const res = await apiFetch(`/conversations/${activeConvId}/block`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { blocked?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast(data.blocked ? 'User blocked' : 'User unblocked', 'info');
      loadConversations();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  const isBlocked = activeConv?.blockedBy != null;
  const isBlockedByMe = activeConv?.blockedBy === user?.userId;

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-4 py-6" style={{ height: 'calc(100vh - 140px)' }}>
      <PageHead title="Messages" />
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Messages</h1>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Conversation list */}
        <div className="w-80 shrink-0 overflow-y-auto border-r border-gray-200">
          {conversations === null && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )}
          {conversations && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">No conversations yet</p>
              <p className="mt-1 text-xs text-gray-400">Start one from a listing page</p>
            </div>
          )}
          {conversations?.map((conv) => {
            const unread = conv.buyerUserId === user?.userId ? conv.buyerUnread : conv.sellerUnread;
            const isActive = conv.conversationId === activeConvId;
            return (
              <button
                key={conv.conversationId}
                type="button"
                onClick={() => selectConversation(conv.conversationId)}
                className={`flex w-full items-start gap-3 border-b border-gray-100 p-3 text-left transition hover:bg-gray-50 ${
                  isActive ? 'bg-teal-50' : ''
                }`}
              >
                {conv.listingImageKey ? (
                  <OptimizedImage
                    imageKey={conv.listingImageKey}
                    alt=""
                    thumbnail
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-400">
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-sm ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {conv.otherUserName}
                    </p>
                    {unread > 0 && (
                      <span className="ml-1 shrink-0 rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-400">{conv.listingTitle}</p>
                  <p className={`mt-0.5 truncate text-xs ${unread > 0 ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                    {conv.lastMessageBody}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Message thread */}
        <div className="flex flex-1 flex-col">
          {!activeConvId && (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="mt-3 text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          )}

          {activeConvId && activeConv && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{activeConv.otherUserName}</p>
                  <p className="truncate text-xs text-gray-400">{activeConv.listingTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleBlock}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isBlockedByMe
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {isBlockedByMe ? 'Unblock' : 'Block User'}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingMsgs && messages.length === 0 && (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderUserId === user?.userId;
                  return (
                    <div
                      key={msg.messageId}
                      className={`mb-3 flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? 'text-teal-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isBlocked ? (
                <div className="border-t border-gray-200 px-4 py-3 text-center text-sm text-gray-400">
                  {isBlockedByMe
                    ? 'You blocked this user. Unblock to send messages.'
                    : 'This conversation has been blocked.'}
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-2 border-t border-gray-200 px-4 py-3">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={sendBusy || !msgInput.trim()}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {sendBusy ? '...' : 'Send'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
