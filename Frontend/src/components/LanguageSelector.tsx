import React, { useMemo } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '../i18n';

export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage, t } = useLanguage();
  
  // Use translations for language names - this will update when language changes
  const languages = useMemo(() => [
    { code: 'en' as Language, flag: '🇺🇸', nativeName: t('language.en', {}) },
    { code: 'hi' as Language, flag: '🇮🇳', nativeName: t('language.hi', {}) },
    { code: 'mr' as Language, flag: '🇮🇳', nativeName: t('language.mr', {}) },
    { code: 'gu' as Language, flag: '🇮🇳', nativeName: t('language.gu', {}) },
    { code: 'pa' as Language, flag: '🇮🇳', nativeName: t('language.pa', {}) },
    { code: 'ta' as Language, flag: '🇮🇳', nativeName: t('language.ta', {}) },
  ], [t]);
  
  const selectedLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleLanguageChange = (langCode: Language) => {
    changeLanguage(langCode);
    // Optional: Add analytics or other side effects here
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-12 px-4 rounded-full shadow-float bg-floating-bg hover:shadow-glow transition-smooth"
            aria-label={t('language.selector')}
          >
            <Globe className="h-4 w-4 mr-2" />
            <span className="text-lg mr-1">{selectedLanguage.flag}</span>
            <span className="font-medium">{selectedLanguage.nativeName}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-48 bg-floating-bg shadow-float border-border/20 animate-bounce-in"
        >
          {languages.map((languageItem) => (
            <DropdownMenuItem
              key={languageItem.code}
              onClick={() => handleLanguageChange(languageItem.code)}
              className="flex items-center justify-between py-3 px-4 hover:bg-accent/50 cursor-pointer transition-smooth"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{languageItem.flag}</span>
                <div>
                  <div className="font-medium">{languageItem.nativeName}</div>
                </div>
              </div>
              {language === languageItem.code && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};