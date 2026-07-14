"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-surface text-body text-body",
          title: "text-strong font-semibold",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-lg",
          cancelButton: "bg-app text-body rounded-lg",
        },
      }}
      {...props}
    />
  );
}
