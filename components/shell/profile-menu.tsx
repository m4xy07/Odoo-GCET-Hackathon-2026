'use client';

import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import { RiLogoutBoxRLine, RiUserLine } from '@remixicon/react';
import * as Avatar from '@/components/ui/avatar';
import * as Dropdown from '@/components/ui/dropdown';

// The avatar circle top right of the mockup: My Profile and Logout
export function ProfileMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const loginId = user?.username ?? '';

  return (
    <Dropdown.Root>
      <Dropdown.Trigger className='rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-base' aria-label='Profile menu'>
        <Avatar.Root size='32' color='gray'>
          {(loginId || '?').slice(0, 2).toUpperCase()}
        </Avatar.Root>
      </Dropdown.Trigger>
      <Dropdown.Content align='end' className='w-56'>
        <div className='px-2 py-1.5'>
          <p className='text-[15px] font-medium leading-[22px] text-text-strong-950'>{loginId}</p>
          <p className='truncate text-[13px] leading-[18px] text-text-sub-600'>{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <Dropdown.Separator />
        <Dropdown.Item asChild>
          <Link href='/profile'>
            <Dropdown.ItemIcon as={RiUserLine} />
            My Profile
          </Link>
        </Dropdown.Item>
        <Dropdown.Item onSelect={() => signOut({ redirectUrl: '/sign-in' })}>
          <Dropdown.ItemIcon as={RiLogoutBoxRLine} />
          Logout
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
