import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Bell, Globe, Moon, Sun, Volume2, VolumeX, Save, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Settings {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    weather: boolean;
    market: boolean;
    schemes: boolean;
    crop: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
  chat: {
    autoPlayAudio: boolean;
    useRAG: boolean;
    defaultLanguage: string;
  };
}

const Settings: React.FC = () => {
  const { t, changeLanguage, language } = useLanguage();
  const [settings, setSettings] = useState<Settings>({
    language: language,
    theme: 'auto',
    notifications: {
      enabled: true,
      weather: true,
      market: true,
      schemes: true,
      crop: true,
    },
    sound: {
      enabled: true,
      volume: 70,
    },
    chat: {
      autoPlayAudio: false,
      useRAG: true,
      defaultLanguage: 'hi',
    },
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Sync settings language with context language - this ensures Settings page updates when language changes from top-right selector
  useEffect(() => {
    setSettings(prev => {
      if (prev.language !== language) {
        return { ...prev, language };
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    // Load settings from localStorage or backend
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        // Sync language from context if it differs
        if (parsed.language && parsed.language !== language) {
          changeLanguage(parsed.language as Language);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      setHasChanges(true);
      return updated;
    });
  };

  const updateNestedSetting = <
    K extends keyof Settings,
    NK extends keyof Settings[K]
  >(
    key: K,
    nestedKey: NK,
    value: any
  ) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        [key]: {
          ...prev[key],
          [nestedKey]: value,
        },
      };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // Language is already applied when changed, just save to localStorage
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    setHasChanges(false);
    // In production, save to backend
    // saveSettings(settings);
  };

  const handleReset = () => {
    const defaultSettings: Settings = {
      language: 'en',
      theme: 'auto',
      notifications: {
        enabled: true,
        weather: true,
        market: true,
        schemes: true,
        crop: true,
      },
      sound: {
        enabled: true,
        volume: 70,
      },
      chat: {
        autoPlayAudio: false,
        useRAG: true,
        defaultLanguage: 'hi',
      },
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {t('pages.settings.title', {})}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('pages.settings.subtitle', {})}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('pages.settings.reset', {})}
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('pages.settings.save', {})}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t('pages.settings.tabs.general', {})}</TabsTrigger>
          <TabsTrigger value="notifications">{t('pages.settings.tabs.notifications', {})}</TabsTrigger>
          <TabsTrigger value="chat">{t('pages.settings.tabs.chat', {})}</TabsTrigger>
          <TabsTrigger value="appearance">{t('pages.settings.tabs.appearance', {})}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('pages.settings.general.title', {})}
              </CardTitle>
              <CardDescription>
                {t('pages.settings.general.description', {})}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.general.language', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.general.languageDesc', {})}
                  </p>
                </div>
                <Select
                  value={language}
                  onValueChange={(value) => {
                    changeLanguage(value as Language);
                    updateSetting('language', value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('language.en', {})}</SelectItem>
                    <SelectItem value="hi">{t('language.hi', {})}</SelectItem>
                    <SelectItem value="mr">{t('language.mr', {})}</SelectItem>
                    <SelectItem value="gu">{t('language.gu', {})}</SelectItem>
                    <SelectItem value="pa">{t('language.pa', {})}</SelectItem>
                    <SelectItem value="ta">{t('language.ta', {})}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t('pages.settings.notifications.title', {})}
              </CardTitle>
              <CardDescription>
                {t('pages.settings.notifications.description', {})}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.notifications.enable', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.notifications.enableDesc', {})}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) =>
                    updateNestedSetting('notifications', 'enabled', checked)
                  }
                />
              </div>
              <Separator />
              {settings.notifications.enabled && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">{t('pages.settings.notifications.weather', {})}</Label>
                    <Switch
                      checked={settings.notifications.weather}
                      onCheckedChange={(checked) =>
                        updateNestedSetting('notifications', 'weather', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">{t('pages.settings.notifications.market', {})}</Label>
                    <Switch
                      checked={settings.notifications.market}
                      onCheckedChange={(checked) =>
                        updateNestedSetting('notifications', 'market', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">{t('pages.settings.notifications.schemes', {})}</Label>
                    <Switch
                      checked={settings.notifications.schemes}
                      onCheckedChange={(checked) =>
                        updateNestedSetting('notifications', 'schemes', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">{t('pages.settings.notifications.crop', {})}</Label>
                    <Switch
                      checked={settings.notifications.crop}
                      onCheckedChange={(checked) =>
                        updateNestedSetting('notifications', 'crop', checked)
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Settings */}
        <TabsContent value="chat">
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle>{t('pages.settings.chat.title', {})}</CardTitle>
              <CardDescription>
                {t('pages.settings.chat.description', {})}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.chat.autoPlay', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.chat.autoPlayDesc', {})}
                  </p>
                </div>
                <Switch
                  checked={settings.chat.autoPlayAudio}
                  onCheckedChange={(checked) =>
                    updateNestedSetting('chat', 'autoPlayAudio', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.chat.useRAG', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.chat.useRAGDesc', {})}
                  </p>
                </div>
                <Switch
                  checked={settings.chat.useRAG}
                  onCheckedChange={(checked) =>
                    updateNestedSetting('chat', 'useRAG', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.chat.defaultLanguage', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.chat.defaultLanguageDesc', {})}
                  </p>
                </div>
                <Select
                  value={settings.chat.defaultLanguage}
                  onValueChange={(value) =>
                    updateNestedSetting('chat', 'defaultLanguage', value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hi">{t('language.hi', {})}</SelectItem>
                    <SelectItem value="mr">{t('language.mr', {})}</SelectItem>
                    <SelectItem value="en">{t('language.en', {})}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : settings.theme === 'light' ? (
                  <Sun className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                {t('pages.settings.appearance.title', {})}
              </CardTitle>
              <CardDescription>
                {t('pages.settings.appearance.description', {})}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.appearance.theme', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.appearance.themeDesc', {})}
                  </p>
                </div>
                <Select
                  value={settings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') =>
                    updateSetting('theme', value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        {t('pages.settings.appearance.theme.light', {})}
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        {t('pages.settings.appearance.theme.dark', {})}
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        {t('pages.settings.appearance.theme.auto', {})}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('pages.settings.appearance.sound', {})}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pages.settings.appearance.soundDesc', {})}
                  </p>
                </div>
                <Switch
                  checked={settings.sound.enabled}
                  onCheckedChange={(checked) =>
                    updateNestedSetting('sound', 'enabled', checked)
                  }
                />
              </div>
              {settings.sound.enabled && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('pages.settings.appearance.volume', {})}</Label>
                    <span className="text-sm text-muted-foreground font-medium">{settings.sound.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sound.volume}
                    onChange={(e) =>
                      updateNestedSetting('sound', 'volume', parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

