import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { seedDatabase } from '../utils/seed';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          
          const adminEmails = [
            'sakthicud07@gmail.com',
            'manisuni94@gmail.com',
            import.meta.env.VITE_ADMIN_EMAIL?.replace(/^["'](.+)["']$/, '$1').toLowerCase().trim()
          ].filter(Boolean).map(e => e.toLowerCase().trim());

          const userEmail = user.email?.toLowerCase().trim();
          const isSystemAdmin = adminEmails.includes(userEmail);
          
          // If system admin, grant admin role and sync Firestore doc
          if (isSystemAdmin) {
            setUserRole('admin');
            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);
              if (!userDoc.exists() || userDoc.data().role !== 'admin') {
                await setDoc(userDocRef, {
                  email: user.email,
                  role: 'admin',
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              }
            } catch (syncErr) {
              console.warn("Could not sync admin document to firestore:", syncErr);
            }
          } else {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role || 'user');
            } else {
              setUserRole('user');
            }
          }

          // Trigger seed only for the system admin
          if (isSystemAdmin) {
            seedDatabase();
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error("Auth status error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { currentUser, userRole, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
