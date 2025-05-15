import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const extendedBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-green-100 text-green-800 hover:bg-green-200/80",
        warning:
          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ExtendedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof extendedBadgeVariants> {}

function ExtendedBadge({ className, variant, ...props }: ExtendedBadgeProps) {
  return (
    <div className={cn(extendedBadgeVariants({ variant }), className)} {...props} />
  )
}

export { ExtendedBadge, extendedBadgeVariants }