import * as React from 'react';

import { cn } from '@/utils/cn';

import { type ControlSize, controlClasses } from './field';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { controlSize?: ControlSize };

/** Zone de texte (WEB-Design-System) : hauteur 92 px minimum, 16/24, mêmes états que <Input>. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, controlSize = 'lg', ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClasses(props['aria-invalid'] === true, false, controlSize), 'min-h-[92px] resize-y py-2.5 leading-6', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
