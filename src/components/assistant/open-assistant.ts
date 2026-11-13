"use client";

export const ASSISTANT_OPEN_EVENT = "cc:open-assistant";

/** Opens the assistant sheet from anywhere inside the app shell. */
export function openAssistant() {
  window.dispatchEvent(new Event(ASSISTANT_OPEN_EVENT));
}
