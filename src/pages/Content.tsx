import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Image, Percent, Tag, Bell, Settings, Plus, Edit, Trash2, Search, Eye, Copy,
  CheckCircle, XCircle, Clock, RefreshCw, Send, Download, Star, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner,
  usePromoCodes, useCreatePromoCode, useUpdatePromoCode, useDeletePromoCode,
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useNotifications, useSendNotification, useNotificationTemplates, useUpdateNotificationTemplate,
  useEmailSettings, useUpdateEmailSettings,
} from '@/hooks/useContent';

// ============ Banner Card Component ============
function BannerCard({ banner, onEdit, onDelete, onToggle }: any) {
  const isActive = banner.status === 'active';
  const isExpired = new Date(banner.end_date) < new Date();
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center">
        <div className="text-center">
          <Image className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-1">Banner Preview</p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{banner.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{banner.description}</p>
            {banner.discount_text && <Badge variant="success" className="text-xs">{banner.discount_text}</Badge>}
          </div>
          <Badge variant={isActive ? 'success' : 'secondary'} className="ml-2 shrink-0">{isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(banner.start_date).toLocaleDateString()} - {new Date(banner.end_date).toLocaleDateString()}
          {isExpired && <Badge variant="warning" className="text-xs">Expired</Badge>}
        </div>
      </CardContent>
      <div className="flex border-t">
        <Button variant="ghost" size="sm" className="flex-1 rounded-none" onClick={() => onToggle(banner)}>
          {isActive ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 rounded-none" onClick={() => onEdit(banner)}>
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-red-500" onClick={() => onDelete(banner)}>
          <Trash2 className="h-3 w-3 mr-1" /> Delete
        </Button>
      </div>
    </Card>
  );
}

// ============ Banner Form Modal ============
function BannerFormModal({ open, onClose, onSave, banner }: any) {
  const [form, setForm] = useState(banner || { title: '', description: '', discount_text: '', link_url: '', status: 'active', start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0] });
  const isEdit = !!banner;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave({ ...form, id: banner?.id });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
          <DialogDescription>Configure banner details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Text (optional)</Label>
              <Input value={form.discount_text || ''} onChange={e => setForm({ ...form, discount_text: e.target.value })} placeholder="e.g. 50% OFF" />
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input value={form.link_url || ''} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Banner'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ Promo Code Card ============
function PromoCodeCard({ code, onEdit, onDelete, onToggle }: any) {
  const isActive = code.status === 'active';
  const isExpired = new Date(code.expiry_date) < new Date();
  const usageRate = code.usage_limit > 0 ? Math.round((code.usage_count / code.usage_limit) * 100) : 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-bold">{code.code}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(code.code)}><Copy className="h-3 w-3" /></Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={code.discount_type === 'percentage' ? 'default' : 'secondary'}>
                {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `${code.discount_value} FCFA OFF`}
              </Badge>
              {code.max_discount && <span className="text-xs text-muted-foreground">Max {code.max_discount} FCFA</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>
            {isExpired && <Badge variant="warning">Expired</Badge>}
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Usage: {code.usage_count} / {code.usage_limit}</span>
            <span>Min Order: {code.min_order_amount} FCFA</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(usageRate, 100)}%` }} />
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Expires: {new Date(code.expiry_date).toLocaleDateString()}</div>
      </CardContent>
      <div className="flex border-t">
        <Button variant="ghost" size="sm" className="flex-1 rounded-none" onClick={() => onToggle(code)}>
          {isActive ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 rounded-none" onClick={() => onEdit(code)}>
          <Edit className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-red-500" onClick={() => onDelete(code)}>
          <Trash2 className="h-3 w-3 mr-1" /> Delete
        </Button>
      </div>
    </Card>
  );
}

// ============ Promo Code Form ============
function PromoCodeFormModal({ open, onClose, onSave, code }: any) {
  const [form, setForm] = useState(code || {
    code: '', discount_type: 'percentage', discount_value: 10, max_discount: 0,
    min_order_amount: 0, usage_limit: 100, usage_count: 0, status: 'active',
    expiry_date: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
  });
  const isEdit = !!code;

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, code: result });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave({ ...form, id: code?.id });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
          <DialogDescription>Configure the promotion code details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="e.g. SUMMER50" />
              {!isEdit && <Button type="button" variant="outline" onClick={generateCode}><RefreshCw className="h-4 w-4" /></Button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Value</Label>
              <Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} required min={1} />
            </div>
          </div>
          {form.discount_type === 'percentage' && (
            <div className="space-y-2">
              <Label>Maximum Discount (FCFA)</Label>
              <Input type="number" value={form.max_discount} onChange={e => setForm({ ...form, max_discount: Number(e.target.value) })} min={0} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Order Amount (FCFA)</Label>
              <Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: Number(e.target.value) })} min={1} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Code'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ Category Management ============
function CategoryManager({ categories, onCreate, onUpdate, onDelete }: any) {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🍽️');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate({ name: newName, icon: newIcon, sort_order: (categories?.length || 0) + 1 });
    setNewName('');
    setNewIcon('🍽️');
  };

  const handleUpdate = (id: string) => {
    onUpdate({ id, name: editName, icon: editIcon });
    setEditingId(null);
  };

  const emojis = ['🍽️','🌶️','🥟','🍣','🥩','🍲','🍖','🍜','🍰','🧋','🥗','🌮','🍕','🥘','🍛','🍝','🥪','🌯','🥙','🧆'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category name..." className="max-w-xs" />
        <Select value={newIcon} onValueChange={setNewIcon}>
          <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {emojis.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} disabled={!newName.trim()}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories?.map((cat: any) => (
          <Card key={cat.id} className="relative">
            <CardContent className="p-3">
              {editingId === cat.id ? (
                <div className="space-y-2">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} size={10} />
                  <div className="flex gap-1">
                    <Select value={editIcon} onValueChange={setEditIcon}>
                      <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                      <SelectContent>{emojis.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleUpdate(cat.id)}><CheckCircle className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><XCircle className="h-3 w-3" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditIcon(cat.icon); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(cat.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ Notification Manager ============
function NotificationManager({ notifications, templates, onSend, onUpdateTemplate }: any) {
  const [tab, setTab] = useState('send');
  const [form, setForm] = useState({ title: '', message: '', type: 'system', recipient_type: 'all' });
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const useTemplate = (templateId: string) => {
    const t = templates?.find((t: any) => t.id === templateId);
    if (t) { setForm({ ...form, title: t.title, message: t.message, type: t.type }); }
  };

  const handleSend = (e: any) => {
    e.preventDefault();
    onSend(form);
    setForm({ title: '', message: '', type: 'system', recipient_type: 'all' });
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="send"><Send className="h-4 w-4 mr-1" /> Send Notification</TabsTrigger>
        <TabsTrigger value="history"><Bell className="h-4 w-4 mr-1" /> History</TabsTrigger>
        <TabsTrigger value="templates"><Tag className="h-4 w-4 mr-1" /> Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="send" className="space-y-4 mt-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Compose Notification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Use Template</Label>
              <Select value={selectedTemplate} onValueChange={v => { setSelectedTemplate(v); useTemplate(v); }}>
                <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                <SelectContent>
                  {templates?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Type</Label>
                  <Select value={form.recipient_type} onValueChange={v => setForm({ ...form, recipient_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="buyers">Buyers Only</SelectItem>
                      <SelectItem value="sellers">Sellers Only</SelectItem>
                      <SelectItem value="drivers">Drivers Only</SelectItem>
                      <SelectItem value="specific">Specific User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Notification title..." />
              </div>
              <div className="space-y-2">
                <Label>Message ({form.message.length} chars)</Label>
                <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} required placeholder="Notification message..." />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-1">Preview:</p>
                <div className="bg-background p-3 rounded border">
                  <p className="font-medium text-sm">{form.title || 'Title'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{form.message || 'Message preview will appear here...'}</p>
                </div>
              </div>
              <Button type="submit" className="w-full"><Send className="h-4 w-4 mr-1" /> Send Notification</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Notification History</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Recipients</th>
                    <th className="text-center p-3 font-medium">Sent</th>
                    <th className="text-center p-3 font-medium">Read</th>
                    <th className="text-center p-3 font-medium">Rate</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications?.map((n: any) => (
                    <tr key={n.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{n.title}</td>
                      <td className="p-3"><Badge variant="outline">{n.type}</Badge></td>
                      <td className="p-3"><Badge variant="secondary">{n.recipient_type}</Badge></td>
                      <td className="p-3 text-center">{n.sent_count}</td>
                      <td className="p-3 text-center">{n.read_count}</td>
                      <td className="p-3 text-center">
                        {n.sent_count > 0 ? `${Math.round((n.read_count / n.sent_count) * 100)}%` : '-'}
                      </td>
                      <td className="p-3 text-xs">{new Date(n.sent_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!notifications || notifications.length === 0) && (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No notifications sent yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates" className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          {templates?.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                  <Badge variant="outline">{t.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs font-medium">Title: {t.title}</p>
                <p className="text-xs text-muted-foreground">{t.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ============ Email/SMS Settings ============
function EmailSettingsPanel({ emailSettings, onUpdate }: any) {
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smsGateway, setSmsGateway] = useState('');
  const [smsApiKey, setSmsApiKey] = useState('');

  // Load settings
  if (emailSettings && !smtpHost) {
    setSmtpHost(emailSettings.smtp_host || '');
    setSmtpPort(emailSettings.smtp_port || '');
    setSmtpUser(emailSettings.smtp_user || '');
    setSmtpPass(emailSettings.smtp_pass || '');
    setSmsGateway(emailSettings.sms_gateway || '');
    setSmsApiKey(emailSettings.sms_api_key || '');
  }

  const handleSave = () => {
    onUpdate({ smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser, smtp_pass: smtpPass, sms_gateway: smsGateway, sms_api_key: smsApiKey });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Email & SMS Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">SMTP Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>SMTP Host</Label><Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.example.com" /></div>
            <div className="space-y-2"><Label>Port</Label><Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Username</Label><Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="noreply@..." /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="********" /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <h4 className="font-medium text-sm">SMS Gateway</h4>
          <div className="space-y-2"><Label>Gateway URL</Label><Input value={smsGateway} onChange={e => setSmsGateway(e.target.value)} placeholder="https://api.sms-provider.com/send" /></div>
          <div className="space-y-2"><Label>API Key</Label><Input type="password" value={smsApiKey} onChange={e => setSmsApiKey(e.target.value)} placeholder="sk_***" /></div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave}><CheckCircle className="h-4 w-4 mr-1" /> Save Settings</Button>
          <Button variant="outline"><Send className="h-4 w-4 mr-1" /> Test Email</Button>
          <Button variant="outline"><Send className="h-4 w-4 mr-1" /> Test SMS</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Main Content Page ============
export default function Content() {
  const [activeTab, setActiveTab] = useState('banners');
  const [bannerPage, setBannerPage] = useState(1);
  const [bannerStatus, setBannerStatus] = useState('all');
  const [promoPage, setPromoPage] = useState(1);
  const [promoStatus, setPromoStatus] = useState('all');
  const [bannerModal, setBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [promoModal, setPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState('');

  const { data: bannersData } = useBanners(bannerPage, 12, bannerStatus);
  const { data: promosData } = usePromoCodes(promoPage, 12, promoStatus);
  const { data: categoriesData } = useCategories();
  const { data: notifsData } = useNotifications(1, 20);
  const { data: templatesData } = useNotificationTemplates();
  const { data: emailSettingsData } = useEmailSettings();

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const createPromo = useCreatePromoCode();
  const updatePromo = useUpdatePromoCode();
  const deletePromo = useDeletePromoCode();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const sendNotification = useSendNotification();
  const updateEmailSettings = useUpdateEmailSettings();

  const handleToggleBanner = (banner: any) => {
    updateBanner.mutate({ id: banner.id, status: banner.status === 'active' ? 'inactive' : 'active' });
  };

  const handleTogglePromo = (code: any) => {
    updatePromo.mutate({ id: code.id, status: code.status === 'active' ? 'inactive' : 'active' });
  };

  const handleDelete = () => {
    if (deleteType === 'banner') deleteBanner.mutate(confirmDelete.id);
    else if (deleteType === 'promo') deletePromo.mutate(confirmDelete.id);
    else if (deleteType === 'category') deleteCategory.mutate(confirmDelete.id);
    setConfirmDelete(null);
  };

  const banners = bannersData?.data || [];
  const promos = promosData?.data || [];
  const categories = categoriesData?.data || [];
  const notifications = notifsData?.data || [];
  const templates = templatesData?.data || [];
  const emailSettings = emailSettingsData?.data || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-sm text-muted-foreground">Manage banners, promotions, categories, and notifications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="banners"><Image className="h-4 w-4 mr-1" /> Banners</TabsTrigger>
          <TabsTrigger value="promos"><Percent className="h-4 w-4 mr-1" /> Promo Codes</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-1" /> Categories</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Email/SMS</TabsTrigger>
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={bannerStatus} onValueChange={v => { setBannerStatus(v); setBannerPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setEditingBanner(null); setBannerModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Banner
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((b: any) => <BannerCard key={b.id} banner={b} onEdit={(b: any) => { setEditingBanner(b); setBannerModal(true); }} onDelete={(b: any) => { setConfirmDelete(b); setDeleteType('banner'); }} onToggle={handleToggleBanner} />)}
          </div>
          {banners.length === 0 && <div className="text-center py-12 text-muted-foreground">No banners found.</div>}
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={promoStatus} onValueChange={v => { setPromoStatus(v); setPromoPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { setEditingPromo(null); setPromoModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Code
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((c: any) => <PromoCodeCard key={c.id} code={c} onEdit={(c: any) => { setEditingPromo(c); setPromoModal(true); }} onDelete={(c: any) => { setConfirmDelete(c); setDeleteType('promo'); }} onToggle={handleTogglePromo} />)}
          </div>
          {promos.length === 0 && <div className="text-center py-12 text-muted-foreground">No promo codes found.</div>}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          <CategoryManager categories={categories} onCreate={(d: any) => createCategory.mutate(d)} onUpdate={(d: any) => updateCategory.mutate(d)} onDelete={(id: string) => { setConfirmDelete({ id }); setDeleteType('category'); }} />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <NotificationManager notifications={notifications} templates={templates} onSend={(d: any) => sendNotification.mutate(d)} onUpdateTemplate={(d: any) => {}} />
        </TabsContent>

        {/* Email/SMS Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <EmailSettingsPanel emailSettings={emailSettings} onUpdate={(d: any) => updateEmailSettings.mutate(d)} />
        </TabsContent>
      </Tabs>

      {/* Banner Form Modal */}
      <BannerFormModal open={bannerModal} onClose={() => { setBannerModal(false); setEditingBanner(null); }} onSave={(d: any) => { if (d.id) updateBanner.mutate(d); else createBanner.mutate(d); }} banner={editingBanner} />

      {/* Promo Code Form Modal */}
      <PromoCodeFormModal open={promoModal} onClose={() => { setPromoModal(false); setEditingPromo(null); }} onSave={(d: any) => { if (d.id) updatePromo.mutate(d); else createPromo.mutate(d); }} code={editingPromo} />

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this item? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {confirmDelete && <div className="p-3 bg-muted rounded"><p className="text-sm font-medium">{confirmDelete.title || confirmDelete.code || confirmDelete.name}</p></div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}