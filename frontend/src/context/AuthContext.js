import React, {createContext,useState,useEffect,useContext,useRef} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const subsRef = useRef([]);
  const registerSub = (unsub) => {
    subsRef.current.push(unsub);
  };
  const clearSubs = () => {
    subsRef.current.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
    subsRef.current = [];
  };
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          setRole(snap.exists() ? snap.data().role : "student");
        } else {
          clearSubs();
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.log("AuthContext error:", error);
        setRole("student");
      } finally {
        setLoading(false);
      }
    });
    return () => {
      unsubAuth();
      clearSubs();
    };
  }, []);
  const logout = async () => {
    try {
      clearSubs();
      await signOut(auth);
      setUser(null);
      setRole(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };
  if (loading) return null;
  return (
    <AuthContext.Provider
      value={{ user, role, loading, registerSub, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};