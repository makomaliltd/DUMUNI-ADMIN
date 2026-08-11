import { Bell, LogOut, Menu, Moon, Search, Sun, User, X, Globe } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; time: string; read: boolean }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setNotifications([
      { id: '1', title: t('header.notifications'), message: 'New order received', time: '5 min ago', read: false },
      { id: '2', title: t('header.notifications'), message: 'User registration spike', time: '1 hour ago', read: false },
      { id: '3', title: t('header.notifications'), message: 'System update completed', time: '3 hours ago', read: true },
    ]);
  }, [t]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const languages = [
    { code: 'en' as const, label: 'English' },
    { code: 'zh' as const, label: '中文' },
    { code: 'fr' as const, label: 'Français' },
  ] as const;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6 transition-shadow',
        scrolled ? 'shadow-sm' : '',
      )}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('header.searchPlaceholder')}
            className="w-64 rounded-full bg-muted pl-9 text-sm lg:w-80"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Globe className="h-5 w-5" />
              <span className="sr-only">Language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map(l => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(lang === l.code && 'bg-accent')}
              >
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <DropdownMenuLabel className="px-0 py-0">{t('header.notifications')}</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">
                  {t('header.markAllRead')}
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">{t('header.noNotifications')}</div>
            ) : (
              notifications.map(notification => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn('flex flex-col items-start gap-1 px-3 py-2', !notification.read && 'bg-accent/50')}
                >
                  <span className="text-sm font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.message}</span>
                  <span className="text-[10px] text-muted-foreground">{notification.time}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.fullName || t('header.admin')}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t('header.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
