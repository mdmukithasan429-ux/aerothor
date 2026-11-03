import { useState, useEffect } from 'react';
import { StoreSettings, DEFAULT_STORE_SETTINGS, applyPrimaryColorToDocument } from './store-settings';

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const reloadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        if (data.settings.primaryColorHex) {
          applyPrimaryColorToDocument(data.settings.primaryColorHex);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh StoreSettings:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.settings) {
          setSettings(data.settings);
          if (data.settings.primaryColorHex) {
            applyPrimaryColorToDocument(data.settings.primaryColorHex);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic StoreSettings, using defaults:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, loading, setSettings, reloadSettings };
}
