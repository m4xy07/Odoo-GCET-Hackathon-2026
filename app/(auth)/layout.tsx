import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Signed in users have no business on the login pages, send them to the dashboard
export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (userId) redirect('/');

  return <main className='flex min-h-screen items-center justify-center bg-bg-weak-50 px-4 py-10'>{children}</main>;
}
