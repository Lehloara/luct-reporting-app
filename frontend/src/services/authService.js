import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const login = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};

export const register = async (email, password, name, role, faculty, classCode = null) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', res.user.uid), {
    uid: res.user.uid,
    email,
    name,
    role,
    faculty,
    classCode, 
    createdAt: new Date().toISOString()
  });
  return res.user;
};

export const logout = async () => await signOut(auth);

export const getUserRole = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().role : null;
};