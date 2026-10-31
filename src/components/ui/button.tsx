import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success" | "cyan";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#FF5533] text-[#0C0C0D] font-bold shadow-[0_4px_16px_rgba(255,85,51,0.35)] hover:shadow-[0_6px_22px_rgba(255,85,51,0.5)] hover:-translate-y-[1px] active:scale-[0.98] border border-[#FF5533]/40",
  secondary:
    "bg-[#1C1C1F] text-[#F5F5F4] hover:bg-[#242428] border border-white/10 shadow-xs hover:-translate-y-[1px] active:scale-[0.98]",
  ghost:
    "text-[#A1A1AA] hover:text-[#F5F5F4] hover:bg-white/[0.05] active:scale-[0.98]",
  outline:
    "border border-white/15 bg-transparent text-[#F5F5F4] hover:bg-white/[0.05] hover:-translate-y-[1px] active:scale-[0.98]",
  danger:
    "bg-[#FF7A59]/15 text-[#FF7A59] hover:bg-[#FF7A59]/25 border border-[#FF7A59]/30 active:scale-[0.98]",
  success:
    "bg-[#3CC8C0]/15 text-[#3CC8C0] hover:bg-[#3CC8C0]/25 border border-[#3CC8C0]/30 active:scale-[0.98]",
  cyan:
    "bg-[#3CC8C0]/15 text-[#3CC8C0] hover:bg-[#3CC8C0]/25 border border-[#3CC8C0]/30 active:scale-[0.98]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 min-h-[36px] min-w-9 px-3.5 text-xs rounded-xl",
  md: "h-11 min-h-[44px] min-w-[44px] px-5 text-sm rounded-xl",
  lg: "h-12 min-h-[48px] px-6 text-base rounded-2xl",
  icon: "h-11 min-h-[44px] w-11 min-w-[44px] rounded-xl p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex select-none items-center justify-center gap-2 font-medium tracking-tight transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5533]",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
