"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  className,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          className ?? "max-w-md border-slate-700 bg-slate-900 text-white"
        }
      >
        <DialogHeader className="space-y-3 p-6 text-center sm:text-center">
          {icon && (
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-400/15">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-white">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-slate-400">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {children && <div className="px-6 pb-2">{children}</div>}

        {footer && (
          <DialogFooter className="px-6 pb-6 pt-4">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
