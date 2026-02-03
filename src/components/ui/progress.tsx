"use client";

import * as React from "react";
import { Progress as FlowbiteProgress } from "flowbite-react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: "primary" | "success" | "failure" | "warning" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
}

function Progress({
  className,
  value = 0,
  max = 100,
  color = "primary",
  size = "md",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <FlowbiteProgress
      progress={percentage}
      color={color}
      size={size}
      className={cn(className)}
      {...props}
    />
  );
}

export { Progress };
