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
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:gap-3 border-white/20 dark:border-white/10 backdrop-saturate-150",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:transition-all group-[.toast]:hover:scale-105 group-[.toast]:hover:shadow-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:transition-all group-[.toast]:hover:bg-muted/80",
          closeButton:
            "group-[.toast]:bg-background/80 group-[.toast]:text-foreground group-[.toast]:border group-[.toast]:border-border/50 group-[.toast]:rounded-lg group-[.toast]:hover:bg-background group-[.toast]:transition-all",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:bg-red-500/10 dark:group-[.toaster]:bg-red-500/5",
          success: "group-[.toaster]:border-green-500/50 group-[.toaster]:bg-green-500/10 dark:group-[.toaster]:bg-green-500/5",
          warning: "group-[.toaster]:border-amber-500/50 group-[.toaster]:bg-amber-500/10 dark:group-[.toaster]:bg-amber-500/5",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:bg-blue-500/10 dark:group-[.toaster]:bg-blue-500/5",
          title: "group-[.toast]:font-semibold group-[.toast]:text-base",
          icon: "group-[.toast]:mt-0.5",
        },
        style: {
          backdropFilter: 'blur(16px) saturate(150%)',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
