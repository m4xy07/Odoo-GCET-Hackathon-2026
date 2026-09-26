'use client';

import * as React from 'react';
import * as Button from '@/components/ui/button';
import * as DigitInput from '@/components/ui/digit-input';
import { FormError } from '@/components/auth/auth-card';

type CodeStepProps = {
  sentTo: string;
  submitLabel?: string;
  // resolves to an error message, or null when the code was accepted
  onSubmit: (code: string) => Promise<string | null>;
  onResend: () => Promise<unknown>;
};

// The 6 digit email code screen, shared by sign up, new device sign in and password reset
export function CodeStep({ sentTo, submitLabel = 'VERIFY', onSubmit, onResend }: CodeStepProps) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setError('Enter the 6 digit code');
    setPending(true);
    setError(await onSubmit(code));
    setPending(false);
  }

  async function resend() {
    setResent(false);
    await onResend();
    setResent(true);
  }

  return (
    <form onSubmit={submit} className='flex flex-col gap-4'>
      <p className='text-center text-[15px] leading-[22px] text-text-sub-600'>
        We sent a 6 digit code to <span className='font-medium text-text-strong-950'>{sentTo}</span>
      </p>
      <DigitInput.Root numInputs={6} value={code} onChange={setCode} hasError={!!error} shouldAutoFocus inputType='tel' />
      <FormError message={error} />
      <Button.Root type='submit' disabled={pending} className='w-full'>
        {pending ? 'Checking...' : submitLabel}
      </Button.Root>
      <button type='button' onClick={resend} className='text-[13px] leading-[18px] text-primary-base hover:underline'>
        {resent ? 'New code sent' : 'Send a new code'}
      </button>
    </form>
  );
}
