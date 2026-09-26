import { auth } from '@clerk/nextjs/server';
import { ensureUser } from '@/lib/auth';
import { PageHeader } from '@/components/shell/page-header';
import { formatDate } from '@/components/lists/format';

export default async function ProfilePage() {
  const { userId } = await auth.protect();
  const user = await ensureUser(userId);

  const rows = [
    ['Login ID', user.loginId],
    ['Email', user.email],
    ['Name', user.name],
    ['Role', user.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'],
    [
      'Member since',
      user.createdAt ? formatDate(user.createdAt.toISOString()) : '',
    ],
  ];

  return (
    <>
      <PageHeader title='My Profile' />
      <section className='rounded-16 border-stroke-soft-200 bg-bg-white-0 max-w-[560px] border p-6'>
        <div className='mb-6 flex items-center gap-4'>
          <span className='bg-bg-weak-50 text-text-sub-600 flex size-14 shrink-0 items-center justify-center rounded-full text-[17px] font-semibold'>
            {user.loginId.slice(0, 2).toUpperCase()}
          </span>
          <div className='min-w-0'>
            <p className='text-[17px] leading-[22px] font-semibold'>
              {user.name}
            </p>
            <p className='text-text-sub-600 truncate text-[13px] leading-[18px]'>
              {user.email}
            </p>
          </div>
        </div>
        <dl className='divide-stroke-soft-200 divide-y'>
          {rows.map(([label, value]) => (
            <div
              key={label}
              className='flex justify-between gap-4 py-3 text-[15px] leading-[22px]'
            >
              <dt className='text-text-sub-600 shrink-0'>{label}</dt>
              <dd className='min-w-0 text-right font-medium break-all'>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
