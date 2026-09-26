import * as Badge from '@/components/ui/badge';
import type { OpStatus } from '@/lib/types';
import { cn } from '@/utils/cn';

export const STATUS_LABEL: Record<OpStatus, string> = {
  draft: 'Draft',
  waiting: 'Waiting',
  ready: 'Ready',
  done: 'Done',
  canceled: 'Canceled',
};

// Colors from the design system: only Ready uses the blue accent
const STATUS_COLOR = {
  draft: 'gray',
  waiting: 'orange',
  ready: 'blue',
  done: 'green',
  canceled: 'gray',
} as const;

export function StatusBadge({
  status,
  className,
}: {
  status: OpStatus;
  className?: string;
}) {
  return (
    <Badge.Root
      variant='lighter'
      size='medium'
      color={STATUS_COLOR[status]}
      className={cn(status === 'canceled' && 'line-through', className)}
    >
      {STATUS_LABEL[status]}
    </Badge.Root>
  );
}

// Small red tag next to operations scheduled before today that are still open
export function LateTag({ className }: { className?: string }) {
  return (
    <Badge.Root
      variant='lighter'
      size='medium'
      color='red'
      className={className}
    >
      Late
    </Badge.Root>
  );
}
