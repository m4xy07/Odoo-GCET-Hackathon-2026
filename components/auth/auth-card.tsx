import { Logo } from '@/components/shell/logo';

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

// The single card from the mockup that holds the login, sign up and reset forms
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className='w-full max-w-[400px] rounded-16 border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-regular-xs sm:p-8'>
      <div className='mb-6 flex flex-col items-center gap-4 text-center'>
        <Logo />
        <div>
          <h1 className='text-[22px] font-semibold leading-7'>{title}</h1>
          {subtitle && <p className='mt-1 text-[13px] leading-[18px] text-text-sub-600'>{subtitle}</p>}
        </div>
      </div>
      {children}
      {footer && <div className='mt-6 text-center text-[13px] leading-[18px] text-text-sub-600'>{footer}</div>}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role='alert' className='rounded-10 bg-error-lighter px-3 py-2 text-center text-[13px] leading-[18px] text-error-base'>
      {message}
    </p>
  );
}
