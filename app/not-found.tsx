import Link from 'next/link';
import * as Button from '@/components/ui/button';
import { Logo } from '@/components/shell/logo';

// Any unknown URL lands here instead of the bare framework page
export default function NotFound() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-weak-50 px-4 text-center'>
      <Logo />
      <div>
        <h1 className='text-[28px] font-semibold leading-[34px] tracking-tight'>Page not found</h1>
        <p className='mt-2 text-[15px] leading-[22px] text-text-sub-600'>This page does not exist or was moved.</p>
      </div>
      <Button.Root asChild>
        <Link href='/'>Back to Dashboard</Link>
      </Button.Root>
    </main>
  );
}
