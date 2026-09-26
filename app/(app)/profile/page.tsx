import { auth } from '@clerk/nextjs/server';
import { ensureUser } from '@/lib/auth';
import { PageHeader } from '@/components/shell/page-header';

export default async function ProfilePage() {
  const { userId } = await auth.protect();
  const user = await ensureUser(userId);

  const rows = [
    ['Login ID', user.loginId],
    ['Email', user.email],
    ['Name', user.name],
    ['Role', user.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'],
    ['Member since', user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''],
  ];

  return (
    <>
      <PageHeader title='My Profile' />
      <section className='max-w-[560px] rounded-16 border border-stroke-soft-200 bg-bg-white-0 p-6'>
        <div className='mb-6 flex items-center gap-4'>
          <span className='flex size-14 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-[17px] font-semibold text-text-sub-600'>
            {user.loginId.slice(0, 2).toUpperCase()}
          </span>
          <div className='min-w-0'>
            <p className='text-[17px] font-semibold leading-[22px]'>{user.name}</p>
            <p className='truncate text-[13px] leading-[18px] text-text-sub-600'>{user.email}</p>
          </div>
        </div>
        <dl className='divide-y divide-stroke-soft-200'>
          {rows.map(([label, value]) => (
            <div key={label} className='flex justify-between gap-4 py-3 text-[15px] leading-[22px]'>
              <dt className='shrink-0 text-text-sub-600'>{label}</dt>
              <dd className='min-w-0 break-all text-right font-medium'>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
