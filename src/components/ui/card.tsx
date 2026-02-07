import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-2xl text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "glass-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
        elevated: "bg-card border border-border/40 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        flat: "bg-card border border-border/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const CardComponent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
CardComponent.displayName = "Card";

const CardHeaderComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeaderComponent.displayName = "CardHeader";

const CardTitleComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-foreground/90", className)}
    {...props}
  />
));
CardTitleComponent.displayName = "CardTitle";

const CardDescriptionComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground/80", className)}
    {...props}
  />
));
CardDescriptionComponent.displayName = "CardDescription";

const CardContentComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContentComponent.displayName = "CardContent";

const CardFooterComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooterComponent.displayName = "CardFooter";

// Memoize all Card components for performance
const Card = React.memo(CardComponent);
const CardHeader = React.memo(CardHeaderComponent);
const CardTitle = React.memo(CardTitleComponent);
const CardDescription = React.memo(CardDescriptionComponent);
const CardContent = React.memo(CardContentComponent);
const CardFooter = React.memo(CardFooterComponent);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
