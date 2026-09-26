'use client';

import * as React from 'react';
import useSWR from 'swr';
import { RiAddLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import { ApiError, fetcher, send } from '@/components/settings/request';
import type { CategoryRow } from '@/lib/services/catalog';
import { categorySchema } from '@/lib/validators';

type Props = { id: string; value: string; onChange: (id: string) => void; hasError?: boolean };

// Category select with an inline "New category", so nobody has to leave the product form
export function CategoryPicker({ id, value, onChange, hasError }: Props) {
  const { data: categories = [], mutate } = useSWR<CategoryRow[]>('/api/categories', fetcher);
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  async function add() {
    const parsed = categorySchema.safeParse({ name });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    try {
      const created = await send<CategoryRow>('POST', '/api/categories', parsed.data);
      await mutate([...categories, created].sort((a, b) => a.name.localeCompare(b.name)), { revalidate: false });
      onChange(created.id);
      setAdding(false);
      setName('');
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields.name ?? err.message) : 'Could not add the category');
    }
  }

  if (adding) {
    return (
      <div className='flex flex-col gap-1'>
        <div className='flex gap-2'>
          <Input.Root hasError={!!error} className='flex-1'>
            <Input.Wrapper>
              <Input.Input
                id={id}
                autoFocus
                placeholder='New category name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                // Enter adds the category instead of submitting the whole product form
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  add();
                }}
              />
            </Input.Wrapper>
          </Input.Root>
          <Button.Root type='button' size='small' onClick={add}>
            Add
          </Button.Root>
          <Button.Root type='button' variant='neutral' mode='ghost' size='small' onClick={() => setAdding(false)}>
            Cancel
          </Button.Root>
        </div>
        {error && <p className='text-paragraph-xs text-error-base'>{error}</p>}
      </div>
    );
  }

  return (
    <div className='flex gap-2'>
      <Select.Root value={value} onValueChange={onChange} hasError={hasError}>
        <Select.Trigger id={id} className='flex-1'>
          <Select.Value placeholder='Pick a category' />
        </Select.Trigger>
        <Select.Content>
          {categories.map((c) => (
            <Select.Item key={c.id} value={c.id}>
              {c.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Button.Root type='button' variant='neutral' mode='stroke' size='small' onClick={() => setAdding(true)} className='h-10' aria-label='New category'>
        <Button.Icon as={RiAddLine} />
        New
      </Button.Root>
    </div>
  );
}
