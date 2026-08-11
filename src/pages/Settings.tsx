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
      <CardHeader><CardTitle className="text-lg">{t('settings.generalTitle')}</CardTitle><CardDescription>{t('settings.generalDesc')}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('settings.platformName')}</Label><Input value={form.platform_name} onChange={e => setForm({ ...form, platform_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>{t('settings.currency')}</Label>
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
          <div className="space-y-2"><Label>{t('settings.platformLogo')}</Label><Input value={form.platform_logo} onChange={e => setForm({ ...form, platform_logo: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>{t('settings.favicon')}</Label><Input value={form.favicon} onChange={e => setForm({ ...form, favicon: e.target.value })} placeholder="https://..." /></div>
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
          <div className="space-y-2"><Label>{t('settings.timezone')}</Label>
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
          <div className="space-y-2"><Label>{t('settings.dateFormat')}</Label>
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
          {saving ? t('settings.saving') : t('settings.saveGeneral')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Delivery Settings ============
function DeliverySettings({ settings, onSave, saving }: { settings: any; onSave: (d: Record<string, string>) => void; saving: boolean }) {
  const { t } = useLanguage();
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
      <CardHeader><CardTitle className="text-lg">{t('settings.deliveryTitle')}</CardTitle><CardDescription>{t('settings.deliveryDesc')}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>{t('settings.baseDeliveryFee')}</Label><Input type="number" value={form.base_delivery_fee} onChange={e => setForm({ ...form, base_delivery_fee: e.target.value })} /></div>
          <div className="space-y-2"><Label>{t('settings.perKmFee')}</Label><Input type="number" value={form.per_km_fee} onChange={e => setForm({ ...form, per_km_fee: e.target.value })} /></div>
          <div className="space-y-2"><Label>{t('settings.maxDistance')}</Label><Input type="number" value={form.max_delivery_distance} onChange={e => setForm({ ...form, max_delivery_distance: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('settings.minEstDelivery')}</Label><Input type="number" value={form.estimated_delivery_min} onChange={e => setForm({ ...form, estimated_delivery_min: e.target.value })} /></div>
          <div className="space-y-2"><Label>{t('settings.maxEstDelivery')}</Label><Input type="number" value={form.estimated_delivery_max} onChange={e => setForm({ ...form, estimated_delivery_max: e.target.value })} /></div>
        </div>
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium">{t('settings.preview')}</p>
          <p className="text-muted-foreground">5 {t('settings.kmDelivery')} {Number(form.base_delivery_fee) + Number(form.per_km_fee) * 5} FCFA • Est. {form.estimated_delivery_min}-{form.estimated_delivery_max} min</p>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? t('settings.saving') : t('settings.saveDelivery')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Payment Settings ============
function PaymentSettings({ settings, onSave, saving }: { settings: any; onSave: (d: Record<string, string>) => void; saving: boolean }) {
  const { t } = useLanguage();
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
      <CardHeader><CardTitle className="text-lg">{t('settings.paymentTitle')}</CardTitle><CardDescription>{t('settings.paymentDesc')}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>{t('settings.commissionRate')}</Label><Input type="number" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} min={0} max={100} /></div>
          <div className="space-y-2"><Label>{t('settings.minOrderAmount')}</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: e.target.value })} min={0} /></div>
          <div className="space-y-2"><Label>{t('settings.taxRate')}</Label><Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} min={0} max={100} /></div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{t('settings.paydunyaConfig')}</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowKeys(!showKeys)}>
              {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-2"><Label>{t('settings.masterKey')}</Label><Input type={showKeys ? 'text' : 'password'} value={form.paydunya_master_key} onChange={e => setForm({ ...form, paydunya_master_key: e.target.value })} placeholder={t('settings.enterMasterKey')} /></div>
          <div className="space-y-2"><Label>{t('settings.privateKey')}</Label><Input type={showKeys ? 'text' : 'password'} value={form.paydunya_private_key} onChange={e => setForm({ ...form, paydunya_private_key: e.target.value })} placeholder={t('settings.enterPrivateKey')} /></div>
          <div className="space-y-2"><Label>{t('settings.token')}</Label><Input type={showKeys ? 'text' : 'password'} value={form.paydunya_token} onChange={e => setForm({ ...form, paydunya_token: e.target.value })} placeholder={t('settings.enterToken')} /></div>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? t('settings.saving') : t('settings.savePayment')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ Email/SMS Settings ============
function EmailSmsSettings({ settings, emailTemplates, onSave, onUpdateTemplate, saving }: { settings: any; emailTemplates: any[]; onSave: (d: Record<string, string>) => void; onUpdateTemplate: (d: any) => void; saving: boolean }) {
  const { t } = useLanguage();
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
        <CardHeader><CardTitle className="text-lg">{t('settings.smtpConfig')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t('settings.smtpHost')}</Label><Input value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('settings.port')}</Label><Input value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>{t('settings.username')}</Label><Input value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('settings.password')}</Label><Input type="password" value={form.smtp_pass} onChange={e => setForm({ ...form, smtp_pass: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>{t('settings.fromEmail')}</Label><Input value={form.smtp_from} onChange={e => setForm({ ...form, smtp_from: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t('settings.smsGateway')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>{t('settings.gatewayUrl')}</Label><Input value={form.sms_gateway} onChange={e => setForm({ ...form, sms_gateway: e.target.value })} placeholder="https://api.sms-provider.com/send" /></div>
          <div className="space-y-2"><Label>{t('settings.apiKey')}</Label><Input type="password" value={form.sms_api_key} onChange={e => setForm({ ...form, sms_api_key: e.target.value })} placeholder="sk_***" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('settings.emailTemplates')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('settings.name')}</th>
                  <th className="text-left p-3 font-medium">{t('settings.subject')}</th>
                  <th className="text-left p-3 font-medium">{t('settings.type')}</th>
                  <th className="text-center p-3 font-medium">{t('settings.actions')}</th>
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
                        <Edit className="h-3 w-3 mr-1" /> {t('settings.edit')}
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
          {saving ? t('settings.saving') : t('settings.saveAllEmail')}
        </Button>
        <Button variant="outline"><Mail className="h-4 w-4 mr-1" /> {t('settings.testEmail')}</Button>
        <Button variant="outline"><Send className="h-4 w-4 mr-1" /> {t('settings.testSms')}</Button>
      </div>

      <Dialog open={templateModal} onOpenChange={() => setTemplateModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{t('settings.editTemplate')} {editingTemplate?.name}</DialogTitle></DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>{t('settings.subject')}</Label>
                <Input value={editingTemplate.subject} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} />
              </div>
              <div className="space-y-2"><Label>{t('settings.body')}</Label>
                <Textarea value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} rows={6} />
              </div>
              <div className="p-2 bg-muted rounded text-xs">
                <p className="font-medium mb-1">{t('settings.availableVariables')}</p>
                <code className="text-muted-foreground">{editingTemplate.variables?.join(', ') || '{customer_name}, {order_id}, {amount}'}</code>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplateModal(false)}>{t('settings.cancel')}</Button>
                <Button onClick={() => { onUpdateTemplate({ id: editingTemplate.id, subject: editingTemplate.subject, body: editingTemplate.body }); setTemplateModal(false); }}>
                  <Save className="h-4 w-4 mr-1" /> {t('settings.saveTemplate')}
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
  const { t } = useLanguage();
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
            <div><CardTitle className="text-lg">{t('settings.adminUsers')}</CardTitle><CardDescription>{t('settings.adminUsersDesc')}</CardDescription></div>
            <Button onClick={() => setAddModal(true)}><Plus className="h-4 w-4 mr-1" /> {t('settings.addAdmin')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('settings.user')}</th>
                  <th className="text-left p-3 font-medium">{t('settings.email')}</th>
                  <th className="text-left p-3 font-medium">{t('settings.role')}</th>
                  <th className="text-center p-3 font-medium">{t('settings.status')}</th>
                  <th className="text-center p-3 font-medium">{t('settings.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers?.map((au: any) => (
                  <tr key={au.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{au.profiles?.full_name || t('settings.unknown')}</td>
                    <td className="p-3 text-muted-foreground">{au.profiles?.email || '-'}</td>
                    <td className="p-3"><Badge variant="secondary">{au.admin_roles?.name || t('settings.noRole')}</Badge></td>
                    <td className="p-3 text-center">
                      <Badge variant={au.is_active ? 'success' : 'secondary'}>{au.is_active ? t('settings.active') : t('settings.inactive')}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Select value={au.role_id || ''} onValueChange={v => onUpdateUser({ id: au.id, role_id: v || null })}>
                          <SelectTrigger className="h-8 w-32"><SelectValue placeholder={t('settings.changeRole')} /></SelectTrigger>
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
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t('settings.noAdminUsers')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-lg">{t('settings.rolesPermissions')}</CardTitle><CardDescription>{t('settings.rolesDesc')}</CardDescription></div>
            <Button onClick={() => openRoleEditor()}><Plus className="h-4 w-4 mr-1" /> {t('settings.createRole')}</Button>
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
          <DialogHeader><DialogTitle>{t('settings.addAdminUser')}</DialogTitle><DialogDescription>{t('settings.addAdminDesc')}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.searchUser')}</Label>
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('settings.searchByNameOrEmail')} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.role')}</Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger><SelectValue placeholder={t('settings.selectRole')} /></SelectTrigger>
                <SelectContent>
                  {adminRoles?.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>{t('settings.addAdminNote')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.userId')}</Label>
              <Input value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder={t('settings.pasteUserId')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>{t('settings.cancel')}</Button>
            <Button onClick={handleAddUser} disabled={!newUserId}><Plus className="h-4 w-4 mr-1" /> {t('settings.addAdmin')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Editor Modal */}
      <Dialog open={roleModal} onOpenChange={() => setRoleModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingRole ? t('settings.editRole') : t('settings.createRole')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t('settings.roleName')}</Label><Input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Support Manager" /></div>
              <div className="space-y-2"><Label>{t('settings.description')}</Label><Input value={roleDesc} onChange={e => setRoleDesc(e.target.value)} placeholder={t('settings.briefDescription')} /></div>
            </div>
            <Separator />
            <Label className="font-medium">{t('settings.permissionsMatrix')}</Label>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">{t('settings.module')}</th>
                    <th className="text-center p-2 font-medium">{t('settings.create')}</th>
                    <th className="text-center p-2 font-medium">{t('settings.read')}</th>
                    <th className="text-center p-2 font-medium">{t('settings.update')}</th>
                    <th className="text-center p-2 font-medium">{t('settings.delete')}</th>
                    <th className="text-center p-2 font-medium">{t('settings.other')}</th>
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
            <Button variant="outline" onClick={() => setRoleModal(false)}>{t('settings.cancel')}</Button>
            <Button onClick={handleSaveRole} disabled={!roleName}><Save className="h-4 w-4 mr-1" /> {t('settings.saveRole')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Activity Logs ============
function ActivityLogsPanel({ logs, total, page, onPageChange, onClear }: any) {
  const { t } = useLanguage();
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
          <div><CardTitle className="text-lg">{t('settings.activityLogs')}</CardTitle><CardDescription>{t('settings.activityLogsDesc')} ({total || 0} {t('settings.totalEntries')})</CardDescription></div>
          <div className="flex gap-2">
            <Select value={filterAction} onValueChange={v => setFilterAction(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder={t('settings.allActions')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('settings.allActions')}</SelectItem>
                <SelectItem value="create">{t('settings.create')}</SelectItem>
                <SelectItem value="update">{t('settings.update')}</SelectItem>
                <SelectItem value="delete">{t('settings.delete')}</SelectItem>
                <SelectItem value="settings_update">{t('settings.settingsUpdate')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onClear}><Trash2 className="h-4 w-4 mr-1" /> {t('settings.clearOldLogs')}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 sticky top-0">
                <th className="text-left p-3 font-medium">{t('settings.action')}</th>
                <th className="text-left p-3 font-medium">{t('settings.admin')}</th>
                <th className="text-left p-3 font-medium">{t('settings.entity')}</th>
                <th className="text-left p-3 font-medium">{t('settings.details')}</th>
                <th className="text-left p-3 font-medium">{t('settings.time')}</th>
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
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t('settings.noActivityLogs')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">{t('settings.pageOf')} {page} {t('settings.of')} {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>{t('settings.previous')}</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>{t('settings.next')}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ Maintenance ============
function MaintenancePanel({ healthData, onRefresh }: any) {
  const { t } = useLanguage();
  const [clearing, setClearing] = useState(false);
  const [backupModal, setBackupModal] = useState(false);

  const statusColor = healthData?.status === 'healthy' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">{t('settings.systemHealth')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold" style={{ color: healthData?.status === 'healthy' ? '#22c55e' : '#ef4444' }}>
                {healthData?.status === 'healthy' ? t('settings.healthy') : t('settings.degraded')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.systemStatus')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{healthData?.db_latency_ms || '-'}ms</p>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.dbLatency')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">{Math.floor(healthData?.server_uptime || 0)}s</p>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.uptime')}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold" style={{ color: healthData?.database === 'connected' ? '#22c55e' : '#ef4444' }}>
                {healthData?.database === 'connected' ? t('settings.connected') : t('settings.error')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('settings.database')}</p>
            </div>
          </div>
          <Button onClick={onRefresh} variant="outline" className="mt-4"><RefreshCw className="h-4 w-4 mr-1" /> {t('settings.refreshHealth')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">{t('settings.maintenanceActions')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('settings.databaseBackup')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.backupDesc')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setBackupModal(true)}>{t('settings.backupNow')}</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('settings.clearCache')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.clearCacheDesc')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setClearing(true); setTimeout(() => setClearing(false), 2000); }}>
                  {clearing ? t('settings.cleared') : t('settings.clearNow')}
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('settings.apiRateLimit')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.apiRateLimitDesc')}</p>
                </div>
                <Badge variant="outline">{t('settings.configured')}</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <Power className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('settings.logRetention')}</h4>
                  <p className="text-xs text-muted-foreground">{t('settings.logRetentionDesc')}</p>
                </div>
                <Badge variant="outline">{t('settings.active')}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={backupModal} onOpenChange={() => setBackupModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('settings.backupTitle')}</DialogTitle><DialogDescription>{t('settings.backupDescLong')}</DialogDescription></DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{t('settings.backupProcess')}</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>{t('settings.backupItem1')}</li>
              <li>{t('settings.backupItem2')}</li>
              <li>{t('settings.backupItem3')}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupModal(false)}>{t('settings.cancel')}</Button>
            <Button onClick={() => { setBackupModal(false); }}><Download className="h-4 w-4 mr-1" /> {t('settings.startBackup')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Main Settings Page ============
export default function SettingsPage() {
  const { t } = useLanguage();
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
        addToast({ title: t('settings.saved'), description: t('settings.savedDesc'), type: 'success' });
      },
      onError: (err: Error) => {
        addToast({ title: t('settings.saveFailed'), description: err.message || t('settings.saveFailedDesc'), type: 'error' });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.pageDesc')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-1" /> {t('settings.general')}</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="h-4 w-4 mr-1" /> {t('settings.delivery')}</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="h-4 w-4 mr-1" /> {t('settings.payment')}</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-1" /> {t('settings.emailSms')}</TabsTrigger>
          <TabsTrigger value="admins"><Shield className="h-4 w-4 mr-1" /> {t('settings.admin')}</TabsTrigger>
          <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-1" /> {t('settings.logs')}</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-1" /> {t('settings.maintenance')}</TabsTrigger>
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
              onSuccess: () => addToast({ title: t('settings.adminAdded'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.adminAddFailed'), description: e.message, type: 'error' }),
            })}
            onUpdateUser={(d: any) => updateUser.mutate(d, {
              onSuccess: () => addToast({ title: t('settings.adminUpdated'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.updateFailed'), description: e.message, type: 'error' }),
            })}
            onRemoveUser={(id: string) => removeUser.mutate(id, {
              onSuccess: () => addToast({ title: t('settings.adminRemoved'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.removeFailed'), description: e.message, type: 'error' }),
            })}
            onCreateRole={(d: any) => createRole.mutate(d, {
              onSuccess: () => addToast({ title: t('settings.roleCreated'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.createFailed'), description: e.message, type: 'error' }),
            })}
            onUpdateRole={(d: any) => updateRole.mutate(d, {
              onSuccess: () => addToast({ title: t('settings.roleUpdated'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.updateFailed'), description: e.message, type: 'error' }),
            })}
            onDeleteRole={(id: string) => deleteRole.mutate(id, {
              onSuccess: () => addToast({ title: t('settings.roleDeleted'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.deleteFailed'), description: e.message, type: 'error' }),
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
              onSuccess: () => addToast({ title: t('settings.oldLogsCleared'), type: 'success' }),
              onError: (e: Error) => addToast({ title: t('settings.clearFailed'), description: e.message, type: 'error' }),
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