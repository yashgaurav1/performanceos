"use client";

/**
 * AIKeyModal has been deprecated and decommissioned.
 * All AI capabilities are now server-grounded using @google/genai, Firebase ID tokens,
 * and server-side GEMINI_API_KEY / GEMINI_MODEL.
 */
export function AIKeyModal(_props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return null;
}
