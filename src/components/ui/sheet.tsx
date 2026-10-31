"use client";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open, onOpenChange, title, description, children, className, footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-line-strong bg-surface outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15" />
          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
            <div className="min-w-0">
              <Drawer.Title className="text-base font-semibold tracking-tight">{title}</Drawer.Title>
              {description ? <Drawer.Description className="mt-0.5 text-xs text-muted">{description}</Drawer.Description> : <Drawer.Description className="sr-only">{typeof title === "string" ? title : "Sheet"}</Drawer.Description>}
            </div>
            <Drawer.Close className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-white/5 hover:text-fg" aria-label="Close">
              <X size={18} />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
          {footer && <div className="pb-safe border-t border-line px-5 py-3">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
