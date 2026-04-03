import React, { ComponentType } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAsyncTranslation } from '../hooks/useAsyncTranslation';

export function withTranslation<P extends object>(
  WrappedComponent: ComponentType<P>,
  translationKeys: string[] = []
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithTranslation = (props: P) => {
    const { t: translate, ...restContext } = useLanguage();
    const { t, getTranslation, isLoading, preloadTranslations } = useAsyncTranslation(
      (key: string, params?: Record<string, string | number>) => Promise.resolve(translate(key, params))
    );

    // Preload translations on mount
    React.useEffect(() => {
      if (translationKeys.length > 0) {
        preloadTranslations(translationKeys);
      }
    }, [preloadTranslations]);

    // Create a translation function that can be used synchronously
    const tSync = (key: string, params?: Record<string, string | number>, defaultValue?: string): string => {
      return getTranslation(key, defaultValue || key);
    };

    return (
      <WrappedComponent
        {...(props as P)}
        t={t}
        tSync={tSync}
        isTranslating={isLoading}
        translationContext={restContext}
      />
    );
  };

  ComponentWithTranslation.displayName = `withTranslation(${displayName})`;

  return ComponentWithTranslation;
}
