"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider, resetFirebaseClient } from "./client";
import { getClientFirebaseConfig, type FirebaseClientConfig } from "./config";
import { updateProfile as updateLocalProfile } from "@/lib/db/repo";
import { syncFirestoreWithLocalDB } from "./firestore-sync";
import { claimLocalData, releaseLocalData } from "@/lib/db/local-owner";
import { toast } from "@/components/ui/toast";

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  provider: "google" | "password";
}

export interface AuthResult {
  success: boolean;
  error?: string;
  /** True when the browser is navigating away (Google redirect sign-in). */
  redirecting?: boolean;
}

interface AuthContextType {
  user: AuthUserProfile | null;
  rawUser: FirebaseUser | null;
  loading: boolean;
  isConfigured: boolean;
  projectConfig: FirebaseClientConfig;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithEmail: (email: string, pass: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const notConfigured = async (): Promise<AuthResult> => ({ success: false, error: "Sign-in isn't configured." });

const AuthContext = createContext<AuthContextType>({
  user: null,
  rawUser: null,
  loading: true,
  isConfigured: false,
  projectConfig: { apiKey: "", authDomain: "", projectId: "", appId: "" },
  signInWithGoogle: notConfigured,
  signInWithEmail: notConfigured,
  signUpWithEmail: notConfigured,
  resetPassword: notConfigured,
  logout: async () => {},
});

/** Plain-language messages for Firebase Auth error codes. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "That email and password don't match. Check them, or reset your password.";
    case "auth/email-already-in-use":
      return "An account already exists for this email. Sign in instead, or reset your password.";
    case "auth/weak-password":
      return "Use at least 6 characters for your password.";
    case "auth/invalid-email":
    case "auth/missing-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "You're offline or the connection dropped. Check your internet and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was closed before it finished.";
    case "auth/unauthorized-domain":
      return "Google sign-in isn't enabled for this web address yet.";
    case "auth/operation-not-allowed":
      return "This sign-in method is turned off for the app.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Phones and installed apps can't reliably use popups, so they use a full-page redirect. */
function prefersRedirect(): boolean {
  if (typeof window === "undefined") return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const touchPhone = window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900;
  return standalone || touchPhone;
}

function toProfile(fbUser: FirebaseUser): AuthUserProfile {
  const providerId = fbUser.providerData[0]?.providerId;
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "You",
    photoURL: fbUser.photoURL,
    isAnonymous: false,
    provider: providerId === "google.com" ? "google" : "password",
  };
}

async function syncProfileToServer(fbUser: FirebaseUser, displayName: string | null) {
  try {
    const idToken = await fbUser.getIdToken();
    await fetch("/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ displayName }),
    });
  } catch {
    // best effort; retried on next session
  }
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [configState, setConfigState] = useState(getClientFirebaseConfig());
  const [rawUser, setRawUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Old demo sessions: forget them so the app asks for a real sign-in.
  useEffect(() => {
    try {
      localStorage.removeItem("cc:demo_auth_user");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onCfgChange = () => {
      resetFirebaseClient();
      setConfigState(getClientFirebaseConfig());
    };
    window.addEventListener("cc:firebase-config-changed", onCfgChange);
    return () => window.removeEventListener("cc:firebase-config-changed", onCfgChange);
  }, []);

  // Surface errors from a Google redirect sign-in (success is picked up by onAuthStateChanged).
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    getRedirectResult(auth).catch((err) => {
      toast("Google sign-in failed", { tone: "coral", body: authErrorMessage(err) });
    });
  }, [configState]);

  // Waits only for Firebase to restore the session from IndexedDB (no server round trip).
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setRawUser(fbUser);
      if (!fbUser || fbUser.isAnonymous) {
        if (fbUser?.isAnonymous) await signOut(auth).catch(() => undefined);
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = toProfile(fbUser);
      // Never show one account's data to another on a shared device.
      await claimLocalData(fbUser.uid);
      setUser(profile);
      setLoading(false);

      const syncedKey = `cc:profile_synced:${fbUser.uid}`;
      if (sessionStorage.getItem(syncedKey) !== "1") {
        sessionStorage.setItem(syncedKey, "1");
        void syncProfileToServer(fbUser, profile.displayName);
      }
      if (profile.displayName) void updateLocalProfile({ display_name: profile.displayName });
      void syncFirestoreWithLocalDB(fbUser.uid);
    });
    return () => unsubscribe();
  }, [configState]);

  async function signInWithGoogle(): Promise<AuthResult> {
    const auth = getFirebaseAuth();
    if (!auth || !configState.isConfigured) return notConfigured();
    const provider = getGoogleProvider();
    try {
      if (prefersRedirect()) {
        await signInWithRedirect(auth, provider);
        return { success: true, redirecting: true };
      }
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Popup blocked (common on some browsers): fall back to a full-page redirect.
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        try {
          await signInWithRedirect(auth, provider);
          return { success: true, redirecting: true };
        } catch (redirectErr) {
          return { success: false, error: authErrorMessage(redirectErr) };
        }
      }
      return { success: false, error: authErrorMessage(err) };
    }
  }

  async function signInWithEmail(email: string, pass: string): Promise<AuthResult> {
    const auth = getFirebaseAuth();
    if (!auth || !configState.isConfigured) return notConfigured();
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      return { success: true };
    } catch (err) {
      return { success: false, error: authErrorMessage(err) };
    }
  }

  async function signUpWithEmail(email: string, pass: string, name?: string): Promise<AuthResult> {
    const auth = getFirebaseAuth();
    if (!auth || !configState.isConfigured) return notConfigured();
    const finalName = name?.trim() || email.split("@")[0] || "You";
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      await updateFirebaseProfile(cred.user, { displayName: finalName }).catch(() => undefined);
      setUser(toProfile(cred.user));
      void updateLocalProfile({ display_name: finalName });
      void syncProfileToServer(cred.user, finalName);
      return { success: true };
    } catch (err) {
      return { success: false, error: authErrorMessage(err) };
    }
  }

  async function resetPassword(email: string): Promise<AuthResult> {
    const auth = getFirebaseAuth();
    if (!auth || !configState.isConfigured) return notConfigured();
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
        url: `${window.location.origin}/login?reset=done`,
      });
      return { success: true };
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Don't reveal whether an account exists for this email.
      if (code === "auth/user-not-found") return { success: true };
      return { success: false, error: authErrorMessage(err) };
    }
  }

  async function logout() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth).catch(() => undefined);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem("cc:current_uid");
    // Don't leave the previous person's meals, workouts or spending on this device.
    await releaseLocalData().catch(() => undefined);
    setUser(null);
    setRawUser(null);
    toast("Signed out");
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
        resetPassword,
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
