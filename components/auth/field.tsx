'use client';

import * as React from 'react';
import { RiErrorWarningFill } from '@remixicon/react';
import * as Input from '@/components/ui/input';
import * as Label from '@/components/ui/label';
import * as Hint from '@/components/ui/hint';

// Align's Input uses size for its own small/medium variants, so the native number size is dropped
type FieldProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> & { label: string; error?: string };

// Label, input and the error under it. Forwards the ref so react-hook-form's register() works.
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(({ label, error, id, ...rest }, ref) => (
  <div className='flex flex-col gap-1'>
    <Label.Root htmlFor={id}>{label}</Label.Root>
    <Input.Root hasError={!!error}>
      <Input.Wrapper>
        <Input.Input ref={ref} id={id} aria-invalid={!!error} {...rest} />
      </Input.Wrapper>
    </Input.Root>
    {error && (
      <Hint.Root hasError>
        <Hint.Icon as={RiErrorWarningFill} />
        {error}
      </Hint.Root>
    )}
  </div>
));
Field.displayName = 'Field';
