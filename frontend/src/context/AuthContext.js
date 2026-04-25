import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const subsRef = useRef([]);

  const registerSub = (unsub) => subsRef.current.push(unsub);
  const clearSubs = () => {
    subsRef.current.forEach(fn => { try { fn(); } catch(e){} });
    subsRef.current = [];
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setRole(snap.exists() ? snap.data().role : 'student');
        } catch { setRole('student'); }
      } else {
        clearSubs(); 
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => { unsubAuth(); clearSubs(); };
  }, []);

  const logout = async () => {
    clearSubs(); 
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, registerSub, logout }}>
      {children}
    </AuthContext.Provider>
  );
};