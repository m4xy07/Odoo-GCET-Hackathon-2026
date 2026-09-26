export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className='flex min-h-screen items-center justify-center bg-bg-weak-50 px-4 py-10'>{children}</main>;
}
