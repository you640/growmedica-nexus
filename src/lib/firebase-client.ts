import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseConfig } from "./firebase-config.functions";

let appPromise: Promise<FirebaseApp> | null = null;

function ensureApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const existing = getApps()[0];
      if (existing) return existing;
      const cfg = await getFirebaseConfig();
      return initializeApp({
        apiKey: cfg.apiKey,
        authDomain: cfg.authDomain,
        projectId: cfg.projectId,
        appId: cfg.appId,
      });
    })();
  }
  return appPromise;
}

export async function getFirebaseAuth() {
  const app = await ensureApp();
  return getAuth(app);
}

export async function signInWithGoogle() {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  const auth = await getFirebaseAuth();
  await fbSignOut(auth);
}

export async function subscribeAuth(cb: (u: User | null) => void) {
  const auth = await getFirebaseAuth();
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken(): Promise<string | null> {
  const auth = await getFirebaseAuth();
  const u = auth.currentUser;
  if (!u) return null;
  return u.getIdToken();
}