"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toast";
import { FirebaseAuthProvider } from "@/lib/firebase/auth-context";
import { CursorSpotlightProvider } from "@/components/motion/cursor-spotlight-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);

  return (
    <QueryClientProvider client={client}>
      <FirebaseAuthProvider>
        <CursorSpotlightProvider>
          {children}
          <Toaster />
        </CursorSpotlightProvider>
      </FirebaseAuthProvider>
    </QueryClientProvider>
  );
}
