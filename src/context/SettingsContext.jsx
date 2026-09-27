import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const DEFAULT_SETTINGS = {
  gymName: 'New Boss Gym',
  theme: 'gold',
  latitude: 11.9111586,
  longitude: 79.6347447,
  radius: 500,
  address: 'No:22, Gayathiri Nagar, 100ft Road, Muthaliyarpet, Pondicherry – 605004',
  phoneNumber: '+91 98765 43210',
  contactEmail: 'hello@newbossgym.com'
};

const getInitialSettings = () => {
  try {
    const cached = localStorage.getItem('nbg_cached_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getInitialSettings);
  const [loading, setLoading] = useState(true);

  const updateSettingsLocal = (newSettings) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('nbg_cached_settings', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
  };

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => {
          const merged = { ...prev, ...data };
          try {
            localStorage.setItem('nbg_cached_settings', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
        
        // Apply theme globally
        const theme = data.theme || 'gold';
        if (theme === 'blue') {
          document.documentElement.classList.add('theme-blue');
        } else {
          document.documentElement.classList.remove('theme-blue');
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Settings listener error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettingsLocal }}>
      {children}
    </SettingsContext.Provider>
  );
};
