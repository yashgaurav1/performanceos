import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Firebase Admin SDK Singleton Initialization · performanceos
 *
 * Safely parses service account credentials from environment variables:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY: full JSON string or base64-encoded JSON string
 * 2. Individual environment variables:
 *    - FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *    - FIREBASE_CLIENT_EMAIL
 *    - FIREBASE_PRIVATE_KEY
 */

interface ServiceAccountConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
}

function parseServiceAccount(): ServiceAccountConfig {
  const defaultProjectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "";

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawJson && rawJson.trim()) {
    try {
      const trimmed = rawJson.trim();
      let jsonString = trimmed;
      if (!trimmed.startsWith("{")) {
        try {
          jsonString = Buffer.from(trimmed, "base64").toString("utf-8");
        } catch {
          // not base64
        }
      }
      const parsed = JSON.parse(jsonString) as {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
      };

      const resolvedProjectId = parsed.project_id || parsed.projectId || defaultProjectId;
      const resolvedEmail = parsed.client_email || parsed.clientEmail;
      const rawPrivateKey = parsed.private_key || parsed.privateKey;
      const resolvedKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined;

      return {
        projectId: resolvedProjectId,
        clientEmail: resolvedEmail,
        privateKey: resolvedKey,
      };
    } catch (err) {
      console.warn("Failed to parse service account JSON string:", err);
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKeyRaw) {
    return {
      projectId: defaultProjectId,
      clientEmail: clientEmail.trim(),
      privateKey: privateKeyRaw.trim().replace(/\\n/g, "\n"),
    };
  }

  return {
    projectId: defaultProjectId,
  };
}

let appInstance: App | null = null;

function initAdmin(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const creds = parseServiceAccount();
  const bucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${creds.projectId}.firebasestorage.app`;

  try {
    if (creds.clientEmail && creds.privateKey) {
      return initializeApp({
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
        storageBucket: bucket,
      });
    }

    return initializeApp({
      projectId: creds.projectId,
      storageBucket: bucket,
    });
  } catch (err) {
    console.warn("Firebase Admin lazy init notice:", err);
    return null;
  }
}

export function getAdminApp(): App | null {
  if (!appInstance) {
    appInstance = initAdmin();
  }
  return appInstance;
}

export const adminApp = appInstance;

export function getAdminAuth(): Auth | null {
  try {
    const app = getAdminApp();
    return app ? getAuth(app) : null;
  } catch {
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  try {
    const app = getAdminApp();
    return app ? getFirestore(app) : null;
  } catch {
    return null;
  }
}

export function getAdminStorage(): Storage | null {
  try {
    const app = getAdminApp();
    return app ? getStorage(app) : null;
  } catch {
    return null;
  }
}
