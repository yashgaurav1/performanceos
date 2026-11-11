"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider, resetFirebaseClient } from "./client";
import { getClientFirebaseConfig, type FirebaseClientConfig } from "./config";
import { updateProfile as updateLocalProfile } from "@/lib/db/repo";
import { syncFirestoreWithLocalDB } from "./firestore-sync";
import { loadDemoData } from "@/lib/demo/seed";
import { toast } from "@/components/ui/toast";

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  provider: "google" | "password" | "anonymous" | "demo";
}

interface AuthContextType {
  user: AuthUserProfile | null;
  rawUser: FirebaseUser | null;
  loading: boolean;
  isConfigured: boolean;
  projectConfig: FirebaseClientConfig;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInAsGuest: (name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  rawUser: null,
  loading: true,
  isConfigured: false,
  projectConfig: { apiKey: "", authDomain: "", projectId: "", appId: "" },
  signInWithGoogle: async () => ({ success: false }),
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInAsGuest: async () => ({ success: false }),
  logout: async () => {},
});

const DEMO_USER_KEY = "cc:demo_auth_user";

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [configState, setConfigState] = useState(getClientFirebaseConfig());
  const [rawUser, setRawUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Read stored database session or demo user on mount
  useEffect(() => {
    async function checkCurrentSession() {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
              setUser({
                uid: data.user.id,
                email: data.user.email,
                displayName: data.user.name,
                photoURL: null,
                isAnonymous: false,
                provider: "password",
              });
              setLoading(false);
              return;
            }
          }
        } catch {
          // network or server check
        }
      }

      try {
        const storedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (storedDemo) {
          const parsed = JSON.parse(storedDemo) as AuthUserProfile;
          setUser(parsed);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }

    void checkCurrentSession();
  }, []);

  // Listen for custom Firebase configuration updates
  useEffect(() => {
    const onCfgChange = () => {
      resetFirebaseClient();
      setConfigState(getClientFirebaseConfig());
    };
    window.addEventListener("cc:firebase-config-changed", onCfgChange);
    return () => window.removeEventListener("cc:firebase-config-changed", onCfgChange);
  }, []);

  // Sync Firebase Auth state
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setRawUser(fbUser);
      if (fbUser) {
        const providerId = fbUser.providerData[0]?.providerId;
        const provider =
          fbUser.isAnonymous
            ? "demo"
            : providerId === "google.com"
            ? "google"
            : "password";

        const profile: AuthUserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Athlete",
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous,
          provider,
        };
        setUser(profile);
        localStorage.removeItem(DEMO_USER_KEY);

        // Sync session to backend cookie
        if (fbUser.email) {
          await fetch("/api/auth/firebase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: fbUser.email,
              uid: fbUser.uid,
              displayName: profile.displayName,
              photoURL: fbUser.photoURL,
            }),
          }).catch(() => undefined);
        }

        if (profile.displayName) {
          void updateLocalProfile({ display_name: profile.displayName });
        }

        // Hydrate and synchronize live Cloud Firestore data
        void syncFirestoreWithLocalDB(fbUser.uid);
      } else {
        const storedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (storedDemo) {
          setUser(JSON.parse(storedDemo) as AuthUserProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [configState]);

  async function syncFirebaseWithBackend(fbUser: { email: string; uid: string; displayName?: string | null; photoURL?: string | null }) {
    try {
      const idToken = await getFirebaseAuth()?.currentUser?.getIdToken();
      if (!idToken) return null;
      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ displayName: fbUser.displayName ?? null }),
      });
      return await res.json();
    } catch {
      return null;
    }
  }

  async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    const auth = getFirebaseAuth();
    if (auth && configState.isConfigured) {
      try {
        const provider = getGoogleProvider();
        const res = await signInWithPopup(auth, provider);
        if (res.user.email) {
          await syncFirebaseWithBackend({
            email: res.user.email,
            uid: res.user.uid,
            displayName: res.user.displayName,
            photoURL: res.user.photoURL,
          });
        }
        toast(`Signed in as ${res.user.displayName ?? res.user.email}`, { tone: "emerald" });
        return { success: true };
      } catch (err: unknown) {
        const errObj = err as { code?: string; message?: string };
        const msg = errObj.message || String(err);
        if (errObj.code === "auth/popup-closed-by-user") {
          toast("Google sign-in popup closed", { tone: "neutral" });
          return { success: false, error: "Popup closed" };
        }
        if (errObj.code === "auth/unauthorized-domain") {
          toast("Domain not authorized in Firebase Console", {
            tone: "amber",
            body: "Add your current domain (osperformance.vercel.app) to Firebase Console > Authentication > Settings > Authorized domains. You can also sign in with Email/Password below.",
          });
          return { success: false, error: "Unauthorized domain in Firebase Console" };
        } else {
          toast("Google sign-in error", { tone: "coral", body: msg });
          return { success: false, error: msg };
        }
      }
    }

    return { success: false, error: "Firebase Authentication is not initialized or configured" };
  }

  async function signInWithEmail(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const auth = getFirebaseAuth();

    // 1. Attempt Firebase Authentication
    if (auth && configState.isConfigured) {
      try {
        const fbRes = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        if (fbRes.user.email) {
          await syncFirebaseWithBackend({
            email: fbRes.user.email,
            uid: fbRes.user.uid,
            displayName: fbRes.user.displayName,
          });
        }
        const activeUser: AuthUserProfile = {
          uid: fbRes.user.uid,
          email: fbRes.user.email,
          displayName: fbRes.user.displayName || cleanEmail.split("@")[0] || null,
          photoURL: fbRes.user.photoURL ?? null,
          isAnonymous: false,
          provider: "password",
        };
        setUser(activeUser);
        localStorage.removeItem(DEMO_USER_KEY);
        toast(`Signed in as ${activeUser.displayName}`, { tone: "emerald" });
        return { success: true };
      } catch (fbErr: unknown) {
        const errObj = fbErr as { code?: string; message?: string };
        const msg =
          errObj.code === "auth/wrong-password" || errObj.code === "auth/invalid-credential" || errObj.code === "auth/user-not-found"
            ? "Wrong email or password."
            : errObj.code === "auth/too-many-requests"
              ? "Too many attempts. Try again in a few minutes."
              : errObj.message || "Could not sign in.";
        toast("Sign in failed", { tone: "coral", body: msg });
        return { success: false, error: msg };
      }
    }

    const msg = "Email sign-in isn't available right now. Try the demo instead.";
    toast("Sign in unavailable", { tone: "amber", body: msg });
    return { success: false, error: msg };
  }

  async function signUpWithEmail(email: string, pass: string, name?: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const finalName = name?.trim() || "Performance Athlete";
    const auth = getFirebaseAuth();

    // 1. Attempt Firebase User Creation
    if (auth && configState.isConfigured) {
      try {
        const fbRes = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (fbRes.user) {
          await updateFirebaseProfile(fbRes.user, { displayName: finalName }).catch(() => undefined);
          await syncFirebaseWithBackend({
            email: cleanEmail,
            uid: fbRes.user.uid,
            displayName: finalName,
          });
        }
        const activeUser: AuthUserProfile = {
          uid: fbRes.user.uid,
          email: cleanEmail,
          displayName: finalName,
          photoURL: null,
          isAnonymous: false,
          provider: "password",
        };
        setUser(activeUser);
        localStorage.removeItem(DEMO_USER_KEY);
        void updateLocalProfile({ display_name: finalName });
        toast("Firebase account registered successfully", { tone: "emerald" });
        return { success: true };
      } catch (fbErr: unknown) {
        const errObj = fbErr as { code?: string; message?: string };
        if (errObj.code === "auth/email-already-in-use") {
          // If already in Firebase, attempt sign in
          return signInWithEmail(cleanEmail, pass);
        }
        if (errObj.code === "auth/weak-password") {
          toast("Registration error", { tone: "coral", body: "Password must be at least 6 characters." });
          return { success: false, error: "Password must be at least 6 characters." };
        }
        if (errObj.code === "auth/invalid-email") {
          toast("Registration error", { tone: "coral", body: "Please enter a valid email address." });
          return { success: false, error: "Invalid email address." };
        }
        const msg = errObj.message || "Could not create your account.";
        toast("Registration error", { tone: "coral", body: msg });
        return { success: false, error: msg };
      }
    }

    const msg = "Sign-up isn't available right now. Try the demo instead.";
    toast("Sign-up unavailable", { tone: "amber", body: msg });
    return { success: false, error: msg };
  }

  async function signInAsGuest(name = "Ayush"): Promise<{ success: boolean; error?: string }> {
    // 1. Post to demo route to initialize backend demo state
    await fetch("/api/auth/demo", { method: "POST" }).catch(() => undefined);

    const auth = getFirebaseAuth();
    if (auth && configState.isConfigured) {
      try {
        const cred = await signInAnonymously(auth);
        if (cred.user) {
          await updateFirebaseProfile(cred.user, { displayName: name }).catch(() => undefined);
          const activeUser: AuthUserProfile = {
            uid: cred.user.uid,
            email: "athlete@performance-os.local",
            displayName: name,
            photoURL: null,
            isAnonymous: true,
            provider: "demo",
          };
          setUser(activeUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(activeUser));
          localStorage.setItem("cc:current_uid", cred.user.uid);
          await loadDemoData();
          void updateLocalProfile({ display_name: name });
          toast(`Connected as ${name}`, {
            tone: "emerald",
            body: "Active 30D historical continuum loaded with verified Firebase token.",
          });
          return { success: true };
        }
      } catch (fbErr) {
        console.warn("Notice signing in anonymously via Firebase:", fbErr);
      }
    }

    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const activeUser: AuthUserProfile = {
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.name,
          photoURL: null,
          isAnonymous: true,
          provider: "demo",
        };
        setUser(activeUser);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(activeUser));
        localStorage.setItem("cc:current_uid", data.user.id);
        await loadDemoData();
        void updateLocalProfile({ display_name: data.user.name });
        toast(`Connected as ${data.user.name || "Ayush"}`, { tone: "emerald", body: "Active 30D historical continuum loaded from database." });
        return { success: true };
      }
    } catch {
      // fallback
    }

    const demoUser: AuthUserProfile = {
      uid: "guest-demo-" + Math.random().toString(36).slice(2, 9),
      email: "athlete@performance-os.local",
      displayName: name,
      photoURL: null,
      isAnonymous: true,
      provider: "demo",
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    await loadDemoData();
    void updateLocalProfile({ display_name: name });
    toast(`Guest Access Activated (${name})`, { tone: "cyan" });
    return { success: true };
  }

  async function logout() {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setRawUser(null);
    toast("Signed out successfully");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        loading,
        isConfigured: configState.isConfigured,
        projectConfig: configState.config,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(AuthContext);
}
