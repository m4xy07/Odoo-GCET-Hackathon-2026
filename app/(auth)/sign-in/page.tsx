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
import { goHome } from '@/components/auth/clerk-errors';
import { signInSchema, type SignInInput } from '@/lib/validators';

// Exact text from the mockup, used for every failed attempt so we never reveal which part was wrong
const INVALID = 'Invalid Login Id or Password';

export default function SignInPage() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [needsCode, setNeedsCode] = React.useState(false);
  const { register, handleSubmit, formState } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: SignInInput) {
    setFormError(null);
    const { error } = await signIn.password({ identifier: values.loginId, password: values.password });
    if (error) return setFormError(INVALID);

    if (signIn.status === 'complete') {
      await signIn.finalize(goHome(router));
    } else if (signIn.status === 'needs_client_trust') {
      // first sign in from a new browser: Clerk asks for a code sent to the account email
      await signIn.mfa.sendEmailCode();
      setNeedsCode(true);
    } else {
      setFormError('Could not finish signing in, try again');
    }
  }

  async function verifyCode(code: string) {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error || signIn.status !== 'complete') return 'That code is not right, check your email';
    await signIn.finalize(goHome(router));
    return null;
  }

  if (needsCode) {
    return (
      <AuthCard title='Check your email' subtitle='New browser, one quick check'>
        <CodeStep sentTo='your email' onSubmit={verifyCode} onResend={() => signIn.mfa.sendEmailCode()} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='Sign in'
      subtitle='Welcome back to your inventory'
      footer={
        <>
          <Link href='/forgot-password' className='text-primary-base hover:underline'>
            Forgot Password?
          </Link>
          <span className='mx-2 text-stroke-sub-300'>|</span>
          <Link href='/sign-up' className='text-primary-base hover:underline'>
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4' noValidate>
        <Field id='loginId' label='Login Id' autoComplete='username' autoFocus error={errors.loginId?.message} {...register('loginId')} />
        <Field
          id='password'
          label='Password'
          type='password'
          autoComplete='current-password'
          error={errors.password?.message}
          {...register('password')}
        />
        <FormError message={formError} />
        <Button.Root type='submit' disabled={isSubmitting} className='mt-2 w-full'>
          {isSubmitting ? 'Signing in...' : 'SIGN IN'}
        </Button.Root>
      </form>
    </AuthCard>
  );
}
