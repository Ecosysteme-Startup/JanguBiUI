import * as React from 'react';

import { cn } from '@/utils/cn';

import { controlClasses } from './field';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { valid?: boolean };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, valid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(controlClasses(props['aria-invalid'] === true, valid), 'h-12', className)}
    {...props}
  />
));
Input.displayName = 'Input';
