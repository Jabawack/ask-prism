"use client";

import * as React from "react";
import { Avatar as FlowbiteAvatar } from "flowbite-react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
  bordered?: boolean;
  status?: "away" | "busy" | "offline" | "online";
  statusPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = "md", rounded = true, bordered, status, statusPosition, children, ...props }, ref) => {
    if (children) {
      // Custom children - use div wrapper
      return (
        <div
          ref={ref}
          className={cn(
            "relative flex shrink-0 overflow-hidden rounded-full",
            {
              "h-6 w-6": size === "xs",
              "h-8 w-8": size === "sm",
              "h-10 w-10": size === "md",
              "h-20 w-20": size === "lg",
              "h-36 w-36": size === "xl",
            },
            className
          )}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <FlowbiteAvatar
        img={src}
        alt={alt}
        size={size}
        rounded={rounded}
        bordered={bordered}
        status={status}
        statusPosition={statusPosition}
        className={cn(className)}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
