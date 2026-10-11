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
          
          const designatedAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'manisuni94@gmail.com')
            .replace(/^["'](.+)["']$/, '$1')
            .toLowerCase()
            .trim();

          const userEmail = user.email?.toLowerCase().trim();
          const isSystemAdmin = userEmail === designatedAdminEmail;
          
          const userDocRef = doc(db, 'users', user.uid);
          // If sole authorized system admin, grant admin role and sync Firestore doc
          if (isSystemAdmin) {
            setUserRole('admin');
            try {
              const userDoc = await getDoc(userDocRef);
              if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
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
            // Any other account is strictly a normal user
            setUserRole('user');
            try {
              const userDoc = await getDoc(userDocRef);
              // Revoke any stale or unauthorized admin privilege from non-designated account
              if (userDoc.exists() && userDoc.data()?.role === 'admin') {
                await setDoc(userDocRef, {
                  role: 'user',
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              }
            } catch (syncErr) {
              console.warn("Could not sanitize user document in firestore:", syncErr);
            }
          }

          // Trigger seed only for the authorized system admin
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
