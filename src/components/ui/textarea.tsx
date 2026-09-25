import * as React from 'react';

import { cn } from '@/utils/cn';

import { controlClasses } from './field';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClasses(props['aria-invalid'] === true), 'resize-y py-2.5 leading-normal', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
