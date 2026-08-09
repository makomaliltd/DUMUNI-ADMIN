import { useState, useEffect } from 'react';
import {
  Globe, Truck, CreditCard, Mail, Shield, Activity, Wrench, Save, Plus, Trash2, Edit,
  Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, Download, Eye, EyeOff, Power,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Language, languages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Send } from 'lucide-react';
import {
  useSettings, useUpdateSettings,
  useAdminRoles, useCreateAdminRole, useUpdateAdminRole, useDeleteAdminRole,
  useAdminUsers, useAddAdminUser, useUpdateAdminUser, useRemoveAdminUser,
  useEmailTemplates, useUpdateEmailTemplate,
  useActivityLogs, useClearActivityLogs,
  useHealthCheck,
} from '@/hooks/useSettings';

// ============ General Settings ============

const TIMEZONE_OPTIONS = [
  { value: 'Europe/London', label: 'UK', flag: '🇬🇧', tz: 'Europe/London' },
  { value: 'Asia/Shanghai', label: 'China', flag: '🇨🇳', tz: 'Asia/Shanghai' },
  { value: 'Africa/Bamako', label: 'Mali', flag: '🇲🇱', tz: 'Africa/Bamako' },
  { value: 'Africa/Douala', label: 'Douala', flag: '🇨🇲', tz: 'Africa/Douala' },
  { value: 'UTC', label: 'UTC', flag: '🌐', tz: 'UTC' },
];

function formatTimeInZone(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatDateInZone(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function GeneralSettings({ settings, onSave, saving }: { settings: any; onSave: (d: Record<string, string>) => void; saving: boolean }) {
  const { lang, setLang, t } = useLanguage();
  const [now, setNow] = useState(() => new Date());
  const [form, setForm] = useState({
    platform_name: '', platform_logo: '', favicon: '', currency: 'FCFA',
    language: lang, timezone: 'Europe/London', date_format: 'YYYY-MM-DD',
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (settings) {
      const sLang = (settings.language as Language) || lang;
      setForm({
        platform_name: settings.platform_name || '',
        platform_logo: settings.platform_logo || '',
        favicon: settings.favicon || '',
        currency: settings.currency || 'FCFA',
        language: sLang,
        timezone: settings.timezone || 'Europe/London',
        date_format: settings.date_format || 'YYYY-MM-DD',
      });
      setLang(sLang);
    }
  }, [settings, lang, setLang]);

  const handleLanguageChange = (v: string) => {
    const matches = languages.filter((l) => l.value === v);
    const safe: Language = matches.length ? matches[0].value : 'en';
    setForm({ ...form, language: safe });
    setLang(safe);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">General Settings</CardTitle><CardDescription>Platform name, branding, and regional preferences</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Platform Name</Label><Input value={form.platform_name} onChange={e => setForm({ ...form, platform_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFA">FCFA (XOF)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Platform Logo URL</Label><Input value={form.platform_logo} onChange={e => setForm({ ...form, platform_logo: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Favicon URL</Label><Input value={form.favicon} onChange={e => setForm({ ...form, favicon: e.target.value })} placeholder="https://..." /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>{t('settings.language')}</Label>
            <Select value={form.language} onValueChange={handleLanguageChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Timezone</Label>
            <Select value={form.timezone} onValueChange={v => setForm({ ...form, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.flag} {opt.label} <span className="ml-2 text-xs text-muted-foreground tabular-nums">{formatTimeInZone(now, opt.tz)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TIMEZONE_OPTIONS.slice(0, 3).map(opt => (
                <div key={opt.value} className="rounded-md border bg-muted/30 p-2 text-center">
                  <div className="text-xs text-muted-foreground">{opt.flag} {opt.label}</div>
                  <div className="font-mono text-sm font-semibold tabular-nums text-orange-500">{formatTimeInZone(now, opt.tz)}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDateInZone(now, opt.tz)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label>Date Format</Label>
            <Select value={form.date_format} onValueChange={v => setForm({ ...form, date_format: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving} className="mt-2">
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? 'Saving...' : 'Save General Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Delivery Settings ============
function DeliverySettings({ settings, onSave, saving }: { settings: any; onSave: (d: Record<string, string>) => void; saving: boolean }) {
  const [form, setForm] = useState({
    base_delivery_fee: '500', per_km_fee: '200', max_delivery_distance: '20',
    estimated_delivery_min: '15', estimated_delivery_max: '45',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        base_delivery_fee: settings.base_delivery_fee || '500',
        per_km_fee: settings.per_km_fee || '200',
        max_delivery_distance: settings.max_delivery_distance || '20',
        estimated_delivery_min: settings.estimated_delivery_min || '15',
        estimated_delivery_max: settings.estimated_delivery_max || '45',
      });
    }
  }, [settings]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Delivery Settings</CardTitle><CardDescription>Configure delivery fees, distances, and time estimates</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Base Delivery Fee (FCFA)</Label><Input type="number" value={form.base_delivery_fee} onChange={e => setForm({ ...form, base_delivery_fee: e.target.value })} /></div>
          <div className="space-y-2"><Label>Per-KM Fee (FCFA)</Label><Input type="number" value={form.per_km_fee} onChange={e => setForm({ ...form, per_km_fee: e.target.value })} /></div>
          <div className="space-y-2"><Label>Max Distance (km)</Label><Input type="number" value={form.max_delivery_distance} onChange={e => setForm({ ...form, max_delivery_distance: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Min Est. Delivery Time (min)</Label><Input type="number" value={form.estimated_delivery_min} onChange={e => setForm({ ...form, estimated_delivery_min: e.target.value })} /></div>
          <div className="space-y-2"><Label>Max Est. Delivery Time (min)</Label><Input type="number" value={form.estimated_delivery_max} onChange={e => setForm({ ...form, estimated_delivery_max: e.target.value })} /></div>
        </div>
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium">Preview:</p>
          <p className="text-muted-foreground">5 km delivery: {Number(form.base_delivery_fee) + Number(form.per_km_fee) * 5} FCFA • Est. {form.estimated_delivery_min}-{form.estimated_delivery_max} min</p>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? 'Saving...' : 'Save Delivery Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Payment Settings ============
function PaymentSettings({ settings, onSave, saving }: { settings: any; onSave: (d: Record<string, string>) => void; saving: boolean }) {
  const [form, setForm] = useState({
    commission_rate: '15', min_order_amount: '1000', tax_rate: '0',
    paydunya_master_key: '', paydunya_private_key: '', paydunya_token: '',
  });
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        commission_rate: settings.commission_rate || '15',
        min_order_amount: settings.min_order_amount || '1000',
        tax_rate: settings.tax_rate || '0',
        paydunya_master_key: settings.paydunya_master_key || '',
        paydunya_private_key: settings.paydunya_private_key || '',
        paydunya_token: settings.paydunya_token || '',
      });
    }
  }, [settings]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Payment Settings</CardTitle><CardDescription>Commission, fees, and payment gateway configuration</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Commission Rate (%)</Label><Input type="number" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} min={0} max={100} /></div>
          <div className="space-y-2"><Label>Min Order Amount (FCFA)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} min={0} /></div>
          <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} min={0} max={100} /></div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">PayDunya Configuration</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)}>
              {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-2"><Label>Master Key</Label><Input type={showKeys ? 'text' : 'password'} value={form.paydunya_master_key} onChange={e => setForm({ ...form, paydunya_master_key: e.target.value })} placeholder="Enter PayDunya Master Key" /></div>
          <div className="space-y-2"><Label>Private Key</Label><Input type={showKeys ? 'text' : 'password'} value={form.paydunya_private_key} onChange={e => setForm({ ...form, paydunya_private_key: e.target.value })} placeholder="Enter PayDunya Private Key" /></div>
          <div className="space-y-2"><Label>Token</Label><Input type={showKeys ? 'text' : 'password'} value={form.paydunya_token} onChange={e => setForm({ ...form, paydunya_token: e.target.value })} placeholder="Enter PayDunya Token" /></div>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Email/SMS Settings ============
function EmailSmsSettings({ settings, emailTemplates, onSave, onUpdateTemplate, saving }: { settings: any; emailTemplates: any[]; onSave: (d: Record<string, string>) => void; onUpdateTemplate: (d: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '', sms_gateway: '', sms_api_key: '',
  });
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateModal, setTemplateModal] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        smtp_host: settings.smtp_host || 'smtp.example.com',
        smtp_port: settings.smtp_port || '587',
        smtp_user: settings.smtp_user || '',
        smtp_pass: settings.smtp_pass || '',
        smtp_from: settings.smtp_from || 'noreply@dumuni.com',
        sms_gateway: settings.sms_gateway || '',
        sms_api_key: settings.sms_api_key || '',
      });
    }
  }, [settings]);

  const handleSave = () => onSave(form);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">SMTP Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>SMTP Host</Label><Input value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} /></div>
            <div className="space-y-2"><Label>Port</Label><Input value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Username</Label><Input value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.smtp_pass} onChange={e => setForm({ ...form, smtp_pass: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>From Email</Label><Input value={form.smtp_from} onChange={e => setForm({ ...form, smtp_from: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">SMS Gateway</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Gateway URL</Label><Input value={form.sms_gateway} onChange={e => setForm({ ...form, sms_gateway: e.target.value })} placeholder="https://api.sms-provider.com/send" /></div>
          <div className="space-y-2"><Label>API Key</Label><Input type="password" value={form.sms_api_key} onChange={e => setForm({ ...form, sms_api_key: e.target.value })} placeholder="sk_***" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Email Templates</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Subject</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailTemplates?.map((t: any) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3 text-muted-foreground">{t.subject}</td>
                    <td className="p-3"><Badge variant="outline">{t.type}</Badge></td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(t); setTemplateModal(true); }}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? 'Saving...' : 'Save All Email/SMS Settings'}
        </Button>
        <Button variant="outline"><Mail className="h-4 w-4 mr-1" /> Test Email</Button>
        <Button variant="outline"><Send className="h-4 w-4 mr-1" /> Test SMS</Button>
      </div>

      <Dialog open={templateModal} onOpenChange={() => setTemplateModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle></DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Subject</Label>
                <Input value={editingTemplate.subject} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} />
              </div>
              <div className="space-y-2"><Label>Body</Label>
                <Textarea value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} rows={6} />
              </div>
              <div className="p-2 bg-muted rounded text-xs">
                <p className="font-medium mb-1">Available variables:</p>
                <code className="text-muted-foreground">{editingTemplate.variables?.join(', ') || '{customer_name}, {order_id}, {amount}'}</code>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplateModal(false)}>Cancel</Button>
                <Button onClick={() => { onUpdateTemplate({ id: editingTemplate.id, subject: editingTemplate.subject, body: editingTemplate.body }); setTemplateModal(false); }}>
                  <Save className="h-4 w-4 mr-1" /> Save Template
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Admin Management ============
function AdminManagement({ adminUsers, adminRoles, onAddUser, onUpdateUser, onRemoveUser, onCreateRole, onUpdateRole, onDeleteRole }: any) {
  const [addModal, setAddModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleModal, setRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [permissions, setPermissions] = useState<any>({});

  const permissionLabels: Record<string, Record<string, string>> = {
    users: { create: 'Create Users', read: 'View Users', update: 'Edit Users', delete: 'Delete Users' },
    orders: { create: 'Create Orders', read: 'View Orders', update: 'Edit Orders', delete: 'Delete Orders' },
    restaurants: { create: 'Create Restaurant', read: 'View Restaurant', update: 'Edit Restaurant', delete: 'Delete Restaurant' },
    drivers: { create: 'Create Driver', read: 'View Driver', update: 'Edit Driver', delete: 'Delete Driver' },
    financial: { read: 'View Financial', approve_withdrawals: 'Approve Withdrawals' },
    settings: { read: 'View Settings', update: 'Edit Settings' },
    notifications: { create: 'Send Notifications', read: 'View Notifications' },
  };

  const openRoleEditor = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDesc(role.description || '');
      setPermissions(role.permissions || {});
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDesc('');
      setPermissions({});
    }
    setRoleModal(true);
  };

  const handleSaveRole = () => {
    const permObj = permissions;
    if (editingRole) {
      onUpdateRole({ id: editingRole.id, name: roleName, description: roleDesc, permissions: permObj });
    } else {
      onCreateRole({ name: roleName, description: roleDesc, permissions: permObj });
    }
    setRoleModal(false);
  };

  const togglePermission = (entity: string, action: string) => {
    setPermissions((prev: any) => ({
      ...prev,
      [entity]: { ...(prev[entity] || {}), [action]: !(prev[entity]?.[action] || false) },
    }));
  };

  const handleAddUser = () => {
    if (newUserId) {
      onAddUser({ user_id: newUserId, role_id: newRoleId || null });
      setAddModal(false);
      setNewUserId('');
      setNewRoleId('');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-lg">Admin Users</CardTitle><CardDescription>Manage admin access and permissions</CardDescription></div>
            <Button onClick={() => setAddModal(true)}><Plus className="h-4 w-4 mr-1" /> Add Admin</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers?.map((au: any) => (
                  <tr key={au.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{au.profiles?.full_name || 'Unknown'}</td>
                    <td className="p-3 text-muted-foreground">{au.profiles?.email || '-'}</td>
                    <td className="p-3"><Badge variant="secondary">{au.admin_roles?.name || 'No Role'}</Badge></td>
                    <td className="p-3 text-center">
                      <Badge variant={au.is_active ? 'success' : 'secondary'}>{au.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Select value={au.role_id || ''} onValueChange={v => onUpdateUser({ id: au.id, role_id: v || null })}>
                          <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Change role" /></SelectTrigger>
                          <SelectContent>
                            {adminRoles?.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onRemoveUser(au.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!adminUsers || adminUsers.length === 0) && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No admin users configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-lg">Roles & Permissions</CardTitle><CardDescription>Define role-based access levels</CardDescription></div>
            <Button onClick={() => openRoleEditor()}><Plus className="h-4 w-4 mr-1" /> Create Role</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {adminRoles?.map((role: any) => (
              <Card key={role.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRoleEditor(role)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDeleteRole(role.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(role.permissions || {}).map(([entity, actions]: any) =>
                      Object.entries(actions).filter(([, v]: any) => v).map(([action]: any) => (
                        <Badge key={`${entity}.${action}`} variant="outline" className="text-xs">{entity}.{action}</Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Admin User Modal */}
      <Dialog open={addModal} onOpenChange={() => setAddModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Admin User</DialogTitle><DialogDescription>Assign an existing user as an admin.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or email..." />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  {adminRoles?.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Note: Enter the user's ID to assign them as an admin. You can find user IDs in the Users Management page.</p>
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="Paste user ID here..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={!newUserId}><Plus className="h-4 w-4 mr-1" /> Add Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Editor Modal */}
      <Dialog open={roleModal} onOpenChange={() => setRoleModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Role Name</Label><Input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Support Manager" /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder="Brief description" /></div>
            </div>
            <Separator />
            <Label className="font-medium">Permissions Matrix</Label>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Module</th>
                    <th className="text-center p-2 font-medium">Create</th>
                    <th className="text-center p-2 font-medium">Read</th>
                    <th className="text-center p-2 font-medium">Update</th>
                    <th className="text-center p-2 font-medium">Delete</th>
                    <th className="text-center p-2 font-medium">Other</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissionLabels).map(([entity, actions]) => (
                    <tr key={entity} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium capitalize">{entity}</td>
                      {Object.entries(actions).map(([action, label]) => (
                        <td key={action} className="p-2 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                            checked={!!(permissions[entity]?.[action])}
                            onChange={() => togglePermission(entity, action)}
                          />
                        </td>
                      ))}
                      {/* Fill remaining cells if fewer actions than 5 */}
                      {Object.keys(actions).length < 5 && Array(5 - Object.keys(actions).length).fill(0).map((_, i) => (
                        <td key={`empty-${i}`} className="p-2" />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModal(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={!roleName}><Save className="h-4 w-4 mr-1" /> Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Activity Logs ============
function ActivityLogsPanel({ logs, total, page, onPageChange, onClear }: any) {
  const [filterAction, setFilterAction] = useState('');

  const actionColors: Record<string, string> = {
    create: 'bg-green-500/10 text-green-600',
    update: 'bg-blue-500/10 text-blue-600',
    delete: 'bg-red-500/10 text-red-600',
    settings_update: 'bg-orange-500/10 text-orange-600',
    login: 'bg-purple-500/10 text-purple-600',
  };

  const totalPages = Math.ceil((total || 0) / 20);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="text-lg">Activity Logs</CardTitle><CardDescription>Track all admin actions ({total || 0} total entries)</CardDescription></div>
          <div className="flex gap-2">
            <Select value={filterAction} onValueChange={v => setFilterAction(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="settings_update">Settings Update</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onClear}><Trash2 className="h-4 w-4 mr-1" /> Clear Old Logs</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 sticky top-0">
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">Admin</th>
                <th className="text-left p-3 font-medium">Entity</th>
                <th className="text-left p-3 font-medium">Details</th>
                <th className="text-left p-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log: any) => (
                <tr key={log.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <Badge className={actionColors[log.action] || 'bg-muted text-muted-foreground'} variant="outline">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="p-3">{log.admin_name || '-'}</td>
                  <td className="p-3 text-muted-foreground">{log.entity_type || '-'}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '-'}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No activity logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Maintenance ============
function MaintenancePanel({ healthData, onRefresh }: any) {
  const [clearing, setClearing] = useState(false);
  const [backupModal, setBackupModal] = useState(false);

  const statusColor = healthData?.status === 'healthy' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">System Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold" style={{ color: healthData?.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                {healthData?.status === 'healthy' ? 'Healthy' : 'Degraded'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">System Status</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{healthData?.db_latency_ms || '-'}ms</p>
              <p className="text-xs text-muted-foreground mt-1">DB Latency</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{Math.floor(healthData?.server_uptime || 0)}s</p>
              <p className="text-xs text-muted-foreground mt-1">Uptime</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold" style={{ color: healthData?.database === 'connected' ? '#22c55e' : '#ef4444' }}>
                {healthData?.database === 'connected' ? 'Connected' : 'Error'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Database</p>
            </div>
          </div>
          <Button onClick={onRefresh} variant="outline" className="mt-4"><RefreshCw className="h-4 w-4 mr-1" /> Refresh Health Check</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Maintenance Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Database Backup</h4>
                  <p className="text-xs text-muted-foreground">Trigger a manual database backup</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setBackupModal(true)}>Backup Now</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Clear Cache</h4>
                  <p className="text-xs text-muted-foreground">Clear system cache and refresh data</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setClearing(true); setTimeout(() => setClearing(false), 2000); }}>
                  {clearing ? 'Cleared!' : 'Clear Now'}
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">API Rate Limit</h4>
                  <p className="text-xs text-muted-foreground">Current: 100 requests/min</p>
                </div>
                <Badge variant="outline">Configured</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <Power className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Log Retention</h4>
                  <p className="text-xs text-muted-foreground">Auto-cleanup after 90 days</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={backupModal} onOpenChange={() => setBackupModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Database Backup</DialogTitle><DialogDescription>This will trigger a manual backup of the entire database.</DialogDescription></DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">The backup process will:</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Create a full snapshot of all tables</li>
              <li>Include all configurations and settings</li>
              <li>Be available for download when complete</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupModal(false)}>Cancel</Button>
            <Button onClick={() => { setBackupModal(false); }}><Download className="h-4 w-4 mr-1" /> Start Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Main Settings Page ============
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [logPage, setLogPage] = useState(1);
  const { addToast } = useToast();

  const { data: settingsData } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: rolesData } = useAdminRoles();
  const { data: adminUsersData } = useAdminUsers();
  const { data: templatesData } = useEmailTemplates();
  const { data: logsData } = useActivityLogs(logPage, 20);
  const { data: healthData, refetch: refetchHealth } = useHealthCheck();

  const createRole = useCreateAdminRole();
  const updateRole = useUpdateAdminRole();
  const deleteRole = useDeleteAdminRole();
  const addUser = useAddAdminUser();
  const updateUser = useUpdateAdminUser();
  const removeUser = useRemoveAdminUser();
  const updateTemplate = useUpdateEmailTemplate();
  const clearLogs = useClearActivityLogs();

  const settings = settingsData?.data || {};
  const adminRoles = rolesData?.data || [];
  const adminUsers = adminUsersData?.data || [];
  const emailTemplates = templatesData?.data || [];
  const logs = logsData?.data || [];
  const logTotal = logsData?.total || 0;
  const health = healthData?.data;

  const saving = updateSettings.isPending;

  const handleSaveSettings = (updates: Record<string, string>) => {
    updateSettings.mutate(updates, {
      onSuccess: () => {
        addToast({ title: 'Settings saved', description: 'Your changes have been saved successfully.', type: 'success' });
      },
      onError: (err: Error) => {
        addToast({ title: 'Save failed', description: err.message || 'Could not save settings. Please try again.', type: 'error' });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Configure system parameters, admin roles, and maintenance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-1" /> General</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="h-4 w-4 mr-1" /> Delivery</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="h-4 w-4 mr-1" /> Payment</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1" /> Email/SMS</TabsTrigger>
          <TabsTrigger value="admins"><Shield className="h-4 w-4 mr-1" /> Admins</TabsTrigger>
          <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-1" /> Activity Logs</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-1" /> Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralSettings settings={settings} onSave={handleSaveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="delivery" className="mt-4">
          <DeliverySettings settings={settings} onSave={handleSaveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <PaymentSettings settings={settings} onSave={handleSaveSettings} saving={saving} />
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <EmailSmsSettings
            settings={settings}
            emailTemplates={emailTemplates}
            onSave={handleSaveSettings}
            onUpdateTemplate={(d: any) => updateTemplate.mutate(d)}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="admins" className="mt-4">
          <AdminManagement
            adminUsers={adminUsers}
            adminRoles={adminRoles}
            onAddUser={(d: any) => addUser.mutate(d, {
              onSuccess: () => addToast({ title: 'Admin user added', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Failed to add admin', description: e.message, type: 'error' }),
            })}
            onUpdateUser={(d: any) => updateUser.mutate(d, {
              onSuccess: () => addToast({ title: 'Admin user updated', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Update failed', description: e.message, type: 'error' }),
            })}
            onRemoveUser={(id: string) => removeUser.mutate(id, {
              onSuccess: () => addToast({ title: 'Admin user removed', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Remove failed', description: e.message, type: 'error' }),
            })}
            onCreateRole={(d: any) => createRole.mutate(d, {
              onSuccess: () => addToast({ title: 'Role created', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Create failed', description: e.message, type: 'error' }),
            })}
            onUpdateRole={(d: any) => updateRole.mutate(d, {
              onSuccess: () => addToast({ title: 'Role updated', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Update failed', description: e.message, type: 'error' }),
            })}
            onDeleteRole={(id: string) => deleteRole.mutate(id, {
              onSuccess: () => addToast({ title: 'Role deleted', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Delete failed', description: e.message, type: 'error' }),
            })}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <ActivityLogsPanel
            logs={logs}
            total={logTotal}
            page={logPage}
            onPageChange={setLogPage}
            onClear={() => clearLogs.mutate(undefined, {
              onSuccess: () => addToast({ title: 'Old logs cleared', type: 'success' }),
              onError: (e: Error) => addToast({ title: 'Clear failed', description: e.message, type: 'error' }),
            })}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenancePanel healthData={health} onRefresh={() => refetchHealth()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}