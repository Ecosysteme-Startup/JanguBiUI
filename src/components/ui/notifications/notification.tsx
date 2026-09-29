'use client';

import { Info, CircleAlert, CircleX, CircleCheck } from 'lucide-react';
import { motion } from 'motion/react';

import { durations, easings } from '@/lib/motion/tokens';

const icons = {
  info: <Info className="size-6 text-info" aria-hidden="true" />,
  success: <CircleCheck className="size-6 text-success" aria-hidden="true" />,
  warning: <CircleAlert className="size-6 text-warning" aria-hidden="true" />,
  error: <CircleX className="size-6 text-destructive" aria-hidden="true" />,
};

export type NotificationProps = {
  notification: {
    id: string;
    type: keyof typeof icons;
    title: string;
    message?: string;
  };
  onDismiss: (id: string) => void;
};

export const Notification = ({
  notification: { id, type, title, message },
  onDismiss,
}: NotificationProps) => {
  return (
    <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
      {/* Toast : fondu + 8 px, 180 ms (entrée et sortie), comme le mobile. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: durations.toast, ease: easings.outCubic }}
        className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-soft-lg"
      >
        <div className="p-4" role="alert" aria-label={title}>
          <div className="flex items-start">
            <div className="shrink-0">{icons[type]}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              {message && (
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              )}
            </div>
            <div className="ml-4 flex shrink-0">
              <button
                className="inline-flex rounded-md text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => {
                  onDismiss(id);
                }}
              >
                <span className="sr-only">Fermer</span>
                <CircleX className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
