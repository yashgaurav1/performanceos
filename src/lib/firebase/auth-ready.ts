import { getFirebaseAuth } from "./client";
import { onAuthStateChanged, type User, type Auth } from "firebase/auth";

/**
 * Waits for Firebase Auth initialization to be fully resolved.
 * Uses auth.authStateReady() if available, with onAuthStateChanged fallback.
 */
export async function waitForAuthReady(authInstance?: Auth | null): Promise<User | null> {
  const auth = authInstance ?? getFirebaseAuth();
  if (!auth) return null;

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
    return auth.currentUser;
  }

  return new Promise<User | null>((resolve) => {
    let resolved = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(user);
      }
    });

    // Safety timeout in case auth state takes long
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          unsubscribe();
        } catch {}
        resolve(auth.currentUser);
      }
    }, 3500);
  });
}

/**
 * Gets a valid Firebase ID token, waiting for auth to be ready first.
 * If forceRefresh is true, requests a fresh token from Firebase.
 */
export async function getValidIdToken(
  forceRefresh = false
): Promise<{ token: string | null; user: User | null }> {
  const user = await waitForAuthReady();
  if (!user) {
    return { token: null, user: null };
  }
  try {
    const token = await user.getIdToken(forceRefresh);
    return { token, user };
  } catch (err) {
    console.warn("Failed to get Firebase ID token:", err);
    return { token: null, user };
  }
}
