'use client';

import { RiKanbanView2, RiListUnordered } from '@remixicon/react';
import * as SegmentedControl from '@/components/ui/segmented-control';

export type ListView = 'list' | 'kanban';

// The two icons at the top right of every list in the mockup. Lists open on 'list' by default.
export function ViewToggle({
  value,
  onChange,
}: {
  value: ListView;
  onChange: (view: ListView) => void;
}) {
  return (
    <SegmentedControl.Root
      value={value}
      onValueChange={(v) => onChange(v as ListView)}
    >
      <SegmentedControl.List className='w-[72px]'>
        <SegmentedControl.Trigger value='list' aria-label='List view'>
          <RiListUnordered className='size-4' />
        </SegmentedControl.Trigger>
        <SegmentedControl.Trigger value='kanban' aria-label='Kanban view'>
          <RiKanbanView2 className='size-4' />
        </SegmentedControl.Trigger>
      </SegmentedControl.List>
    </SegmentedControl.Root>
  );
}
