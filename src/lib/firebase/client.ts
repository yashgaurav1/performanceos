import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getClientFirebaseConfig } from "./config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let activeAppKey = "";

export function getFirebaseApp(): FirebaseApp | null {
  const { config, isConfigured } = getClientFirebaseConfig();
  if (!isConfigured || !config.apiKey || !config.projectId) {
    return null;
  }

  const appKey = `${config.projectId}::${config.apiKey}`;
  if (!app || activeAppKey !== appKey) {
    if (getApps().length > 0) {
      // Find existing or initialize named
      try {
        app = getApp("[DEFAULT]");
      } catch {
        app = initializeApp(config);
      }
    } else {
      app = initializeApp(config);
    }
    activeAppKey = appKey;
    auth = getAuth(app);

    // Initialize Firestore with persistent local cache for multi-tab offline support
    if (typeof window !== "undefined") {
      try {
        firestore = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        firestore = getFirestore(app);
      }
    } else {
      firestore = getFirestore(app);
    }

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  }

  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    getFirebaseApp();
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!firestore) {
    getFirebaseApp();
  }
  return firestore;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!storage) {
    const a = getFirebaseApp();
    if (a) {
      storage = getStorage(a);
    }
  }
  return storage;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  }
  return googleProvider;
}

export function resetFirebaseClient() {
  app = null;
  auth = null;
  firestore = null;
  storage = null;
  googleProvider = null;
  activeAppKey = "";
}
