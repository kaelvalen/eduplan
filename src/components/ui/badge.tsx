import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/80 text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25",
        outline:
          "border-border/60 text-foreground hover:bg-muted/50",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300",
        warning:
          "border-transparent bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300",
        info:
          "border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const BadgeComponent = ({ className, variant, ...props }: BadgeProps) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};

// Memoize Badge component for performance
const Badge = React.memo(BadgeComponent);

export { Badge, badgeVariants };
