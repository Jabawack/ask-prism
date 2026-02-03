"use client";

import * as React from "react";
import { Alert as FlowbiteAlert } from "flowbite-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-[var(--color-success)]/50 text-[var(--color-success)] bg-[var(--color-success)]/10",
        warning:
          "border-[var(--color-warning)]/50 text-[var(--color-warning)] bg-[var(--color-warning)]/10",
        info:
          "border-[var(--color-primary)]/50 text-[var(--color-primary)] bg-[var(--color-primary)]/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Map variants to Flowbite colors
const variantToFlowbite: Record<string, "info" | "success" | "failure" | "warning" | "gray"> = {
  default: "gray",
  destructive: "failure",
  success: "success",
  warning: "warning",
  info: "info",
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, onDismiss, children, ...props }, ref) => {
    const flowbiteColor = variantToFlowbite[variant || "default"];

    return (
      <FlowbiteAlert
        color={flowbiteColor}
        icon={icon}
        onDismiss={onDismiss}
        className={cn(className)}
        {...props}
      >
        {children}
      </FlowbiteAlert>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
