'use client';

import * as React from 'react';
import * as Button from '@/components/ui/button';
import * as Modal from '@/components/ui/modal';
import { notification } from '@/hooks/use-notification';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => Promise<unknown>;
};

// Small confirm for deletes. A refusal from the server (still has locations, has stock) stays visible here.
export function DeleteConfirm({ open, onOpenChange, title, onConfirm }: Props) {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      notification({ status: 'success', title: 'Deleted' });
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal.Root
      open={open}
      onOpenChange={(next) => {
        setError(null);
        onOpenChange(next);
      }}
    >
      <Modal.Content>
        <Modal.Header title={title} description='This cannot be undone.' />
        {error && <Modal.Body className='text-paragraph-sm text-error-base'>{error}</Modal.Body>}
        <Modal.Footer className='justify-end'>
          <Modal.Close asChild>
            <Button.Root variant='neutral' mode='stroke' size='small'>
              Cancel
            </Button.Root>
          </Modal.Close>
          <Button.Root variant='error' size='small' onClick={confirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete'}
          </Button.Root>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
