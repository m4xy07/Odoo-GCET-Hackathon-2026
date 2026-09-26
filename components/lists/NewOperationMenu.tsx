'use client';

import Link from 'next/link';
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react';
import * as Button from '@/components/ui/button';
import * as Dropdown from '@/components/ui/dropdown';

const OPTIONS = [
  { slug: 'receipts', label: 'Receipt' },
  { slug: 'deliveries', label: 'Delivery' },
  { slug: 'transfers', label: 'Internal Transfer' },
  { slug: 'adjustments', label: 'Adjustment' },
];

// NEW on Move History: the ledger is never written by hand, so it starts one of the operations instead
export function NewOperationMenu() {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Button.Root size='small'>
          <Button.Icon as={RiAddLine} />
          New
          <Button.Icon as={RiArrowDownSLine} />
        </Button.Root>
      </Dropdown.Trigger>
      <Dropdown.Content align='start' className='w-48'>
        {OPTIONS.map((o) => (
          <Dropdown.Item key={o.slug} asChild>
            <Link href={`/operations/${o.slug}/new`}>{o.label}</Link>
          </Dropdown.Item>
        ))}
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
