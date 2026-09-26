import { TopBar } from '@/components/shell/top-bar';

// Every signed in page: the mockup top bar, then the page inside a 1200px column
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='flex min-h-screen flex-col'>
      <TopBar />
      <main className='mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8'>{children}</main>
    </div>
  );
}
