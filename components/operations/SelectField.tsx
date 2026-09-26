'use client';

import { RiErrorWarningFill } from '@remixicon/react';
import * as Hint from '@/components/ui/hint';
import * as Label from '@/components/ui/label';
import * as Select from '@/components/ui/select';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

// Label, select and the error under it, same layout as the text fields
export function SelectField({ id, label, value, onChange, options, placeholder, error, disabled }: Props) {
  return (
    <div className='flex flex-col gap-1'>
      <Label.Root htmlFor={id}>{label}</Label.Root>
      <Select.Root value={value} onValueChange={onChange} disabled={disabled} hasError={!!error}>
        <Select.Trigger id={id} aria-invalid={!!error}>
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content>
          {options.map((o) => (
            <Select.Item key={o.value} value={o.value}>
              {o.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      {error && (
        <Hint.Root hasError>
          <Hint.Icon as={RiErrorWarningFill} />
          {error}
        </Hint.Root>
      )}
    </div>
  );
}
