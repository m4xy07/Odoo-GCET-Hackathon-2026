'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignUp } from '@clerk/nextjs';
import * as Button from '@/components/ui/button';
import { AuthCard, FormError } from '@/components/auth/auth-card';
import { Field } from '@/components/auth/field';
import { CodeStep } from '@/components/auth/code-step';
import { clerkErrors, goHome } from '@/components/auth/clerk-errors';
import { signUpSchema, type SignUpInput } from '@/lib/validators';

// Clerk names the fields differently from our form
const FIELD_FOR_PARAM: Record<string, keyof SignUpInput> = {
  username: 'loginId',
  email_address: 'email',
  password: 'password',
};

export default function SignUpPage() {
  const { signUp } = useSignUp();
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });
  const { errors, isSubmitting } = formState;

  async function onSubmit(values: SignUpInput) {
    setFormError(null);
    const { error } = await signUp.password({ username: values.loginId, emailAddress: values.email, password: values.password });

    for (const e of clerkErrors(error)) {
      const field = e.param ? FIELD_FOR_PARAM[e.param] : undefined;
      let message = e.message;
      if (e.code === 'form_identifier_exists') message = field === 'loginId' ? 'This Login ID is taken' : 'This email is already registered';
      if (e.code === 'form_password_pwned') message = 'This password showed up in a data leak, pick another';
      if (field) setError(field, { message });
      else setFormError(message);
    }
    if (error) return;

    if (signUp.status === 'complete') return void (await signUp.finalize(goHome(router)));
    await signUp.verifications.sendEmailCode();
    setSentTo(values.email);
  }

  async function verifyCode(code: string) {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return 'That code is not right, check your email';
    if (signUp.status !== 'complete') return 'Could not finish sign up, try again';
    await signUp.finalize(goHome(router));
    return null;
  }

  if (sentTo) {
    return (
      <AuthCard title='Verify your email' subtitle='Last step before your dashboard'>
        <CodeStep sentTo={sentTo} onSubmit={verifyCode} onResend={() => signUp.verifications.sendEmailCode()} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='Sign up'
      subtitle='Create your StockSense account'
      footer={
        <>
          Already have an account?{' '}
          <Link href='/sign-in' className='text-primary-base hover:underline'>
            Sign In
          </Link>
        </>
      }
    >
      {/* field order and labels follow the mockup */}
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4' noValidate>
        <Field id='loginId' label='Enter Login Id' autoComplete='username' autoFocus error={errors.loginId?.message} {...register('loginId')} />
        <Field id='email' label='Enter Email Id' type='email' autoComplete='email' error={errors.email?.message} {...register('email')} />
        <Field
          id='password'
          label='Enter Password'
          type='password'
          autoComplete='new-password'
          error={errors.password?.message}
          {...register('password')}
        />
        <Field
          id='confirm'
          label='Re-Enter Password'
          type='password'
          autoComplete='new-password'
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <p className='text-[13px] leading-[18px] text-text-sub-600'>
          Login ID 6 to 12 characters. Password more than 8 characters with a lowercase, an uppercase and a special character.
        </p>
        <FormError message={formError} />
        {/* Clerk's bot check mounts here when it is enabled for the app */}
        <div id='clerk-captcha' />
        <Button.Root type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? 'Creating account...' : 'SIGN UP'}
        </Button.Root>
      </form>
    </AuthCard>
  );
}
