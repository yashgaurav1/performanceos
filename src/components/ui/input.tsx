import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-bg/70 px-3 text-[15px] text-fg placeholder:text-faint",
        "outline-none transition-colors focus:border-indigo/60 focus:ring-2 focus:ring-indigo/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-line bg-bg/70 px-3 py-2.5 text-[15px] text-fg placeholder:text-faint",
        "outline-none transition-colors focus:border-indigo/60 focus:ring-2 focus:ring-indigo/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-11 w-full rounded-xl border border-line bg-bg/70 px-3 text-[15px] text-fg outline-none focus:border-indigo/60", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-faint", className)} {...props} />;
}
