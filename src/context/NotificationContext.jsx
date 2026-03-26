import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    // Fetch membership alerts (expiring in 7 days or already expired)
    const membersRef = collection(db, 'members');
    
    // Using onSnapshot for real-time updates
    const unsubscribe = onSnapshot(membersRef, (snapshot) => {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 86400000);
      
      const membershipAlerts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(member => {
          if (!member.endDate) return false;
          const endDate = member.endDate.toDate?.() ?? new Date(member.endDate);
          return endDate <= in7Days;
        })
        .sort((a, b) => {
          const dateA = a.endDate.toDate?.() ?? new Date(a.endDate);
          const dateB = b.endDate.toDate?.() ?? new Date(b.endDate);
          return dateA - dateB;
        });

      setAlerts(membershipAlerts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notification alerts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    alerts,
    alertCount: alerts.filter(m => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = m.endDate.toDate?.() ?? new Date(m.endDate);
      const daysLeft = Math.ceil((endDate - today) / 86400000);
      return daysLeft <= 3; // Standard threshold for high priority alerts
    }).length,
    loading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
