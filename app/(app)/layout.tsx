// Top bar, dropdown nav and the mobile drawer land here next (components/shell)
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className='mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8'>{children}</main>;
}
