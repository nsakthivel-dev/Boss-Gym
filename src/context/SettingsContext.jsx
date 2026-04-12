import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    gymName: 'Boss Gym',
    theme: 'gold',
    latitude: 11.9111586,
    longitude: 79.6347447,
    radius: 500
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({ ...prev, ...data }));
        
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
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
