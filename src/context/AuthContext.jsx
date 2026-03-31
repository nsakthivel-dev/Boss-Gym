import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Check if user is the specific admin by email
            if (user.email === 'nsakthiveldev@gmail.com') {
              setUserRole('admin');
              seedDatabase();
            } else {
              setUserRole(userData.role || 'user');
            }
          } else {
            // New user, check if it's the specific admin
            if (user.email === 'nsakthiveldev@gmail.com') {
              setUserRole('admin');
            } else {
              setUserRole('user');
            }
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
