import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertTriangle, Info, X, Filter, CheckCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'weather' | 'market' | 'scheme' | 'crop' | 'system';
  actionUrl?: string;
}

const Notifications: React.FC = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'weather' | 'market' | 'scheme' | 'crop' | 'system'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock notifications - in production, fetch from backend
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Weather Alert',
          message: 'Heavy rainfall expected in your area tomorrow. Take necessary precautions for your crops.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
          category: 'weather',
        },
        {
          id: '2',
          type: 'success',
          title: 'Market Price Update',
          message: 'Wheat prices have increased by ₹50 per quintal in your region.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          read: false,
          category: 'market',
        },
        {
          id: '3',
          type: 'info',
          title: 'New Scheme Available',
          message: 'PM-KISAN scheme registration is now open. Apply before the deadline.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          read: true,
          category: 'scheme',
          actionUrl: '/schemes',
        },
        {
          id: '4',
          type: 'alert',
          title: 'Crop Health Reminder',
          message: 'Time to check your wheat crop for pest infestation. Schedule a health check.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          read: true,
          category: 'crop',
          actionUrl: '/crop-health',
        },
        {
          id: '5',
          type: 'info',
          title: 'Fertilizer Application Reminder',
          message: 'Your wheat crop is ready for the second fertilizer application.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          read: true,
          category: 'crop',
          actionUrl: '/fertilizer',
        },
        {
          id: '6',
          type: 'success',
          title: 'System Update',
          message: 'New features added: Voice chat and multilingual support.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          read: true,
          category: 'system',
        },
      ];
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.category === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'alert':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-primary/20 bg-primary/5';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return t('time.minutesAgo', { count: minutes }) || `${minutes} minutes ago`;
    if (hours < 24) {
      const key = hours === 1 ? 'time.hoursAgo_one' : 'time.hoursAgo_other';
      return t(key, { count: hours }) || `${hours} hours ago`;
    }
    if (days < 7) {
      const key = days === 1 ? 'time.daysAgo_one' : 'time.daysAgo_other';
      return t(key, { count: days }) || `${days} days ago`;
    }
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">{t('common.loading', {}) || 'Loading notifications...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {t('pages.notifications.title', {})}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('pages.notifications.subtitle', {})}
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} {t('pages.notifications.unread', {})}
          </Badge>
        )}
      </div>

      {/* Filters and Actions */}
      <Card className="shadow-float">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pages.notifications.filter.all', {})}</SelectItem>
                  <SelectItem value="unread">{t('pages.notifications.filter.unread', {})}</SelectItem>
                  <SelectItem value="weather">{t('pages.notifications.filter.weather', {})}</SelectItem>
                  <SelectItem value="market">{t('pages.notifications.filter.market', {})}</SelectItem>
                  <SelectItem value="scheme">{t('pages.notifications.filter.scheme', {})}</SelectItem>
                  <SelectItem value="crop">{t('pages.notifications.filter.crop', {})}</SelectItem>
                  <SelectItem value="system">{t('pages.notifications.filter.system', {})}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                {t('pages.notifications.markAllRead', {})}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="shadow-float">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">
              {t('pages.notifications.noNotifications', {})}
            </h3>
            <p className="text-muted-foreground">
              {t('pages.notifications.noNotificationsDesc', {})}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`shadow-float transition-smooth hover:shadow-glow ${
                !notification.read ? 'border-l-4 border-l-primary' : ''
              } ${getNotificationColor(notification.type)}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                        {notification.actionUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 p-0 h-auto"
                            onClick={() => {
                              window.location.href = notification.actionUrl!;
                            }}
                          >
                            {t('pages.notifications.viewDetails', {})} →
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                            title={t('pages.notifications.markRead', {})}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                          title={t('pages.notifications.delete', {})}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

