"use client";

import React from "react";
import NumberFlow from "@number-flow/react";

interface OdometerProps {
  value: number;
  format?: React.ComponentProps<typeof NumberFlow>["format"];
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function Odometer({
  value,
  format,
  className = "num font-bold",
  prefix = "",
  suffix = "",
}: OdometerProps) {
  return (
    <span className={`inline-flex items-baseline tabular-nums tracking-tight ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <NumberFlow
        value={value}
        format={format}
        animated={true}
        transformTiming={{ duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        spinTiming={{ duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        opacityTiming={{ duration: 250, easing: "ease-out" }}
      />
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}
