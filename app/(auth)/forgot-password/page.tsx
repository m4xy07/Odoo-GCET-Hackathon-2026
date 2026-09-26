'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignIn } from '@clerk/nextjs';
import * as Button from '@/components/ui/button';
import { AuthCard, FormError } from '@/components/auth/auth-card';
import { Field } from '@/components/auth/field';
import { CodeStep } from '@/components/auth/code-step';
import { clerkErrors, goHome } from '@/components/auth/clerk-errors';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators';

// Three steps in one card: who are you, the emailed code, then the new password
export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [step, setStep] = React.useState<'identify' | 'code' | 'password'>('identify');
  const [identifier, setIdentifier] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  const form = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });
  const { errors, isSubmitting } = form.formState;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!identifier.trim()) return setFormError('Enter your Login ID or email');
    setSending(true);
    const created = await signIn.create({ identifier: identifier.trim() });
    const sent = created.error ? created : await signIn.resetPasswordEmailCode.sendCode();
    setSending(false);
    if (sent.error) {
      const notFound = clerkErrors(sent.error).some((err) => err.code === 'form_identifier_not_found');
      return setFormError(notFound ? 'No account found for that Login ID or email' : 'Could not send the code, try again');
    }
    setStep('code');
  }

  async function verifyCode(code: string) {
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) return 'That code is not right, check your email';
    setStep('password');
    return null;
  }

  async function savePassword(values: ResetPasswordInput) {
    setFormError(null);
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password: values.password, signOutOfOtherSessions: true });
    const pwned = clerkErrors(error).some((err) => err.code === 'form_password_pwned');
    if (error) return setFormError(pwned ? 'This password showed up in a data leak, pick another' : 'Could not save the password, try again');
    if (signIn.status === 'complete') await signIn.finalize(goHome(router));
    else setFormError('Password saved. Sign in with it now.');
  }

  const backToSignIn = (
    <Link href='/sign-in' className='text-primary-base hover:underline'>
      Back to Sign In
    </Link>
  );

  if (step === 'code') {
    return (
      <AuthCard title='Check your email' subtitle='Enter the code to reset your password' footer={backToSignIn}>
        <CodeStep sentTo='the email on your account' onSubmit={verifyCode} onResend={() => signIn.resetPasswordEmailCode.sendCode()} />
      </AuthCard>
    );
  }

  if (step === 'password') {
    return (
      <AuthCard title='New password' subtitle='More than 8 characters with a lowercase, an uppercase and a special character'>
        <form onSubmit={form.handleSubmit(savePassword)} className='flex flex-col gap-4' noValidate>
          <Field
            id='password'
            label='Enter Password'
            type='password'
            autoComplete='new-password'
            autoFocus
            error={errors.password?.message}
            {...form.register('password')}
          />
          <Field
            id='confirm'
            label='Re-Enter Password'
            type='password'
            autoComplete='new-password'
            error={errors.confirm?.message}
            {...form.register('confirm')}
          />
          <FormError message={formError} />
          <Button.Root type='submit' disabled={isSubmitting} className='w-full'>
            {isSubmitting ? 'Saving...' : 'SAVE PASSWORD'}
          </Button.Root>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title='Forgot Password?' subtitle='We will email you a 6 digit code' footer={backToSignIn}>
      <form onSubmit={sendCode} className='flex flex-col gap-4' noValidate>
        <Field
          id='identifier'
          label='Login Id or Email Id'
          autoComplete='username'
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <FormError message={formError} />
        <Button.Root type='submit' disabled={sending} className='w-full'>
          {sending ? 'Sending...' : 'SEND CODE'}
        </Button.Root>
      </form>
    </AuthCard>
  );
}
