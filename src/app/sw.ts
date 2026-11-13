/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  NetworkOnly,
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. NEVER cache /api/ responses or the Firebase sign-in helper pages (/__/auth, /__/firebase)
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/__/"),
      handler: new NetworkOnly(),
    },
    // 2. Offline App Shell: NetworkFirst for app routes (/today, /eat, /train, etc.)
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" &&
        [
          "/today",
          "/eat",
          "/train",
          "/coach",
          "/money",
          "/goals",
          "/settings",
          "/study",
        ].some((route) => url.pathname === route || url.pathname.startsWith(route + "/")),
      handler: new NetworkFirst({
        cacheName: "performanceos-app-shell",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // 3. Static assets & Next.js chunks
    {
      matcher: ({ request, url }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font" ||
        url.pathname.startsWith("/_next/static/"),
      handler: new StaleWhileRevalidate({
        cacheName: "performanceos-static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // 4. Media & Icons
    {
      matcher: ({ request, url }) =>
        request.destination === "image" ||
        url.pathname.startsWith("/images/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/screenshots/"),
      handler: new CacheFirst({
        cacheName: "performanceos-media",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
