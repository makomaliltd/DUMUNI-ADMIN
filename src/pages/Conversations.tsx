import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Send, Store, AlertTriangle, MessageSquare, Loader2, RefreshCw, Lock, Clock,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';
import {
  useConversations, useConversation, useConversationMessages,
  useSendAdminMessage, useFlagConversation, useSetConversationStatus, useMarkConversationRead,
} from '@/hooks/useConversations';
import type { AdminConversation, ConversationMessage } from '@/hooks/useConversations';

// Couleur de badge par statut de commande (même grammaire que le reste du back-office).
function orderStatusVariant(status?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'refused':
    case 'rejected':
      return 'destructive';
    case 'accepted':
    case 'preparing':
    case 'ready':
    case 'delivering':
      return 'info';
    default:
      return 'secondary';
  }
}

function initialsOf(name?: string | null): string {
  if (!name) return '?';
  return name.trim().slice(0, 2).toUpperCase();
}

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

// ============ Bulle de message ============
function MessageBubble({ message }: { message: ConversationMessage }) {
  const { t } = useLanguage();
  const role = message.sender_role;
  const isSystem = role === 'system' || message.message_type === 'system' || message.message_type === 'order_status';
  const isAdmin = role === 'admin';
  const alignRight = isAdmin || role === 'seller';

  const roleLabel = t(`conversations.role.${role}`);

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <div className="rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
          {message.body}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} py-1`}>
      <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {roleLabel}
        {message.sender_name ? ` · ${message.sender_name}` : ''}
      </span>
      <div
        className={
          isAdmin
            ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary-500 px-4 py-2 text-sm text-white'
            : alignRight
              ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-orange-500/15 px-4 py-2 text-sm'
              : 'max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm'
        }
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noreferrer"
            className={`mt-1 block text-xs underline ${isAdmin ? 'text-white/80' : 'text-primary-500'}`}
          >
            {t('conversations.attachment')}
          </a>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatTime(message.created_at)}
        {message.quick_action && (
          <Badge variant="warning" className="ml-1 text-[10px]">
            {t(`conversations.quickAction.${message.quick_action}`)}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============ Ligne de liste ============
function ConversationRow({
  conversation, active, onSelect,
}: {
  conversation: AdminConversation;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();
  const isDispute = conversation.is_flagged || (conversation.quick_action_count || 0) > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 ${
        active ? 'bg-primary-500/10' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <Avatar alt={conversation.buyer_name || undefined} fallback={initialsOf(conversation.buyer_name)} />
          <span className="text-xs text-muted-foreground">↔</span>
          <Avatar alt={conversation.seller_name || undefined} fallback={initialsOf(conversation.seller_name)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {conversation.buyer_name || t('conversations.buyer')}
              {' ↔ '}
              {conversation.seller_name || t('conversations.seller')}
            </p>
            {(conversation.admin_unread_count || 0) > 0 && (
              <Badge variant="default" className="shrink-0 text-[10px]">
                {conversation.admin_unread_count} {t('conversations.unread')}
              </Badge>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Store className="h-3 w-3 shrink-0" />
            <span className="truncate">{conversation.restaurant_name || '—'}</span>
          </div>

          {conversation.last_message_preview && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.last_message_preview}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-[10px]">
              {t(`conversations.topic.${conversation.topic}`)}
            </Badge>
            {conversation.order_status && (
              <Badge variant={orderStatusVariant(conversation.order_status)} className="text-[10px]">
                {conversation.order_status}
              </Badge>
            )}
            {conversation.status === 'closed' && (
              <Badge variant="secondary" className="text-[10px]">
                {t('conversations.statusClosed')}
              </Badge>
            )}
            {isDispute && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {t('conversations.dispute')}
              </Badge>
            )}
          </div>
        </div>

        <span className="shrink-0 text-[11px] text-muted-foreground">{formatTime(conversation.last_message_at)}</span>
      </div>
    </button>
  );
}

// ============ Page ============
export default function Conversations() {
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(
    () => ({ status, q: debouncedSearch, flagged: flaggedOnly || undefined }),
    [status, debouncedSearch, flaggedOnly],
  );

  const { data: listData, isLoading, isError, error, refetch, isFetching } = useConversations(filters);
  const conversations: AdminConversation[] = listData?.data || [];

  const { data: detail } = useConversation(selectedId || undefined);
  const { data: messages, isLoading: messagesLoading } = useConversationMessages(selectedId || undefined);

  const sendMessage = useSendAdminMessage();
  const flagConversation = useFlagConversation();
  const setStatusMutation = useSetConversationStatus();
  const markRead = useMarkConversationRead();

  const threadRef = useRef<HTMLDivElement>(null);

  // Sélection par défaut : premier fil de la liste.
  useEffect(() => {
    if (!selectedId && conversations.length > 0) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  // Marquer comme lu côté admin à l'ouverture du fil.
  const unreadCount = detail?.admin_unread_count || 0;
  const markReadMutate = markRead.mutate;
  useEffect(() => {
    if (selectedId && unreadCount > 0) {
      markReadMutate(selectedId);
    }
  }, [selectedId, unreadCount, markReadMutate]);

  // Scroll auto vers le bas du fil.
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const conversation: AdminConversation | undefined =
    conversations.find((c) => c.id === selectedId) || detail;

  const handleSend = () => {
    if (!selectedId || !draft.trim()) return;
    sendMessage.mutate(
      { id: selectedId, message: draft.trim() },
      {
        onSuccess: () => {
          setDraft('');
          addToast({ title: t('conversations.replySent'), type: 'success' });
        },
        onError: (e: Error) => addToast({ title: t('conversations.replyFailed'), description: e.message, type: 'error' }),
      },
    );
  };

  const handleToggleStatus = () => {
    if (!selectedId || !conversation) return;
    const next = conversation.status === 'closed' ? 'open' : 'closed';
    setStatusMutation.mutate(
      { id: selectedId, status: next },
      {
        onSuccess: () =>
          addToast({
            title: next === 'closed' ? t('conversations.closedOk') : t('conversations.reopenedOk'),
            type: 'success',
          }),
        onError: (e: Error) => addToast({ title: t('conversations.actionFailed'), description: e.message, type: 'error' }),
      },
    );
  };

  const handleToggleFlag = () => {
    if (!selectedId || !conversation) return;
    const next = !conversation.is_flagged;
    flagConversation.mutate(
      { id: selectedId, flagged: next, reason: next ? 'Flagged from admin back-office' : undefined },
      {
        onSuccess: () =>
          addToast({
            title: next ? t('conversations.flaggedOk') : t('conversations.unflaggedOk'),
            type: 'success',
          }),
        onError: (e: Error) => addToast({ title: t('conversations.actionFailed'), description: e.message, type: 'error' }),
      },
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('conversations.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('conversations.description')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,400px)_1fr]">
        {/* Colonne liste */}
        <Card className="flex h-[calc(100vh-14rem)] flex-col">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              {t('conversations.list')}
              {listData?.total ? (
                <Badge variant="secondary" className="text-[10px]">{listData.total}</Badge>
              ) : null}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('conversations.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="open">{t('conversations.statusOpen')}</SelectItem>
                  <SelectItem value="closed">{t('conversations.statusClosed')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={flaggedOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFlaggedOnly((v) => !v)}
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                {t('conversations.flaggedOnly')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.loading')}
              </div>
            )}
            {isError && (
              <div className="px-4 py-8 text-center text-sm text-destructive">
                {(error as Error)?.message || t('conversations.loadFailed')}
              </div>
            )}
            {!isLoading && !isError && conversations.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {t('conversations.noConversations')}
              </div>
            )}
            {conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                active={c.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </CardContent>
        </Card>

        {/* Colonne détail / chat */}
        <Card className="flex h-[calc(100vh-14rem)] flex-col">
          {!conversation ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              {t('conversations.selectConversation')}
            </div>
          ) : (
            <>
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {conversation.subject || t('conversations.title')}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {conversation.buyer_name || t('conversations.buyer')}
                      {conversation.buyer_email ? ` (${conversation.buyer_email})` : ''}
                      {' ↔ '}
                      {conversation.seller_name || t('conversations.seller')}
                      {conversation.seller_email ? ` (${conversation.seller_email})` : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {conversation.restaurant_name || '—'}
                      </span>
                      {conversation.order_id && (
                        <span>
                          {t('conversations.order')} #{conversation.order_id.slice(0, 8)}
                        </span>
                      )}
                      {conversation.order_total != null && (
                        <span>{formatCurrency(conversation.order_total)}</span>
                      )}
                      {conversation.order_status && (
                        <Badge variant={orderStatusVariant(conversation.order_status)} className="text-[10px]">
                          {conversation.order_status}
                        </Badge>
                      )}
                    </div>
                    {conversation.flagged_reason && (
                      <p className="mt-1 text-xs text-destructive">
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                        {conversation.flagged_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToggleFlag}>
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      {conversation.is_flagged ? t('conversations.unflag') : t('conversations.flag')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleToggleStatus}>
                      {conversation.status === 'closed' ? (
                        <RefreshCw className="mr-1 h-4 w-4" />
                      ) : (
                        <Lock className="mr-1 h-4 w-4" />
                      )}
                      {conversation.status === 'closed'
                        ? t('conversations.reopen')
                        : t('conversations.close')}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent
                ref={threadRef}
                className="flex-1 overflow-y-auto border-t bg-muted/20 p-4"
              >
                {messagesLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </div>
                )}
                {!messagesLoading && (!messages || messages.length === 0) && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t('conversations.noMessages')}
                  </div>
                )}
                {(messages || []).map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </CardContent>

              <div className="space-y-2 border-t p-4">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder={t('conversations.replyPlaceholder')}
                  disabled={conversation.status === 'closed'}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {conversation.status === 'closed' ? t('conversations.closedNotice') : ''}
                  </span>
                  <Button
                    onClick={handleSend}
                    disabled={!draft.trim() || sendMessage.isPending || conversation.status === 'closed'}
                  >
                    <Send className="mr-1 h-4 w-4" />
                    {sendMessage.isPending ? t('conversations.sending') : t('conversations.send')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
