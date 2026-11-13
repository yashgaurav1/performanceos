/**
 * Firebase Client Configuration.
 * Supports environment variables (`NEXT_PUBLIC_FIREBASE_*`)
 * as well as runtime in-app configuration stored in localStorage.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const DEFAULT_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

/**
 * Hosts that serve Firebase's sign-in helper themselves (next.config.ts proxies
 * /__/auth/* and serves /__/firebase/init.json). On these hosts the auth domain is
 * the site itself, so Google sign-in never depends on third-party cookies or on
 * Firebase Hosting. Each host needs `https://<host>/__/auth/handler` listed as an
 * authorized redirect URI on the Google OAuth web client.
 */
const SELF_HOSTED_AUTH_HOSTS = (process.env.NEXT_PUBLIC_AUTH_SELF_HOSTED_HOSTS || "osperformance.vercel.app")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

function resolveAuthDomain(envDomain: string): string {
  if (typeof window === "undefined") return envDomain;
  return SELF_HOSTED_AUTH_HOSTS.includes(window.location.host) ? window.location.host : envDomain;
}

export interface FirebaseConfigState {
  config: FirebaseClientConfig;
  isConfigured: boolean;
  source: "env" | "custom" | "none";
}

export function getClientFirebaseConfig(): FirebaseConfigState {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("cc:firebase_config");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FirebaseClientConfig>;
        if (parsed.apiKey && parsed.projectId) {
          return {
            config: {
              apiKey: parsed.apiKey,
              authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
              projectId: parsed.projectId,
              storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
              messagingSenderId: parsed.messagingSenderId || "",
              appId: parsed.appId || "",
            },
            isConfigured: true,
            source: "custom",
          };
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  const isEnvConfigured = Boolean(
    DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId,
  );

  return {
    config: { ...DEFAULT_FIREBASE_CONFIG, authDomain: resolveAuthDomain(DEFAULT_FIREBASE_CONFIG.authDomain) },
    isConfigured: isEnvConfigured,
    source: isEnvConfigured ? "env" : "none",
  };
}

export function saveCustomFirebaseConfig(config: FirebaseClientConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cc:firebase_config", JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("cc:firebase-config-changed"));
}

export function clearCustomFirebaseConfig() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("cc:firebase_config");
  window.dispatchEvent(new CustomEvent("cc:firebase-config-changed"));
}
