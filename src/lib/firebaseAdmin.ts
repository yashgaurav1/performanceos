import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Lazy Firebase Admin SDK Initialization · performanceos
 *
 * Reads:
 * - FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 *
 * All initializations occur lazily inside function calls.
 * If credentials are missing, throws a clear Error naming the missing environment variables.
 */

interface ServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function resolveProjectId(): string {
  const pid =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "";
  return pid.trim();
}

function resolveServiceAccount(): ServiceAccountConfig {
  const defaultProjectId = resolveProjectId();

  // 1. Check for complete JSON key in env
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

      const projectId = parsed.project_id || parsed.projectId || defaultProjectId;
      const clientEmail = parsed.client_email || parsed.clientEmail;
      const privateKey = parsed.private_key || parsed.privateKey;

      if (clientEmail && privateKey) {
        let key = privateKey.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
          key = key.slice(1, -1);
        }
        key = key.replace(/\\n/g, "\n");
        return {
          projectId,
          clientEmail: clientEmail.trim(),
          privateKey: key,
        };
      }
    } catch (parseErr) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string:", parseErr);
    }
  }

  // 2. Check for individual env vars
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  const missing: string[] = [];
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!rawKey) missing.push("FIREBASE_PRIVATE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Firebase Admin initialization failed: Missing required environment variable(s): ${missing.join(", ")}.`
    );
  }

  let privateKey = rawKey!;
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  return {
    projectId: defaultProjectId,
    clientEmail: clientEmail!,
    privateKey,
  };
}

export function getAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const { projectId, clientEmail, privateKey } = resolveServiceAccount();
  const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    `${projectId}.firebasestorage.app`;

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  } catch (err: unknown) {
    const existing = getApps();
    if (existing.length > 0 && existing[0]) {
      return existing[0];
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Firebase Admin initializeApp failed: ${message}`);
  }
}

export function getAdminAuth(): Auth {
  const app = getAdminApp();
  return getAuth(app);
}

export function getAdminFirestore(): Firestore {
  const app = getAdminApp();
  return getFirestore(app);
}

export function getAdminStorage(): Storage {
  const app = getAdminApp();
  return getStorage(app);
}
