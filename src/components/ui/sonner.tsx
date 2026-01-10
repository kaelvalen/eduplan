"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/contexts/theme-context";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/60 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/40 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl border-white/20 dark:border-white/10",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium rounded-lg",
          error: "group-[.toaster]:text-red-500",
          success: "group-[.toaster]:text-green-500",
          warning: "group-[.toaster]:text-amber-500",
          info: "group-[.toaster]:text-blue-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
