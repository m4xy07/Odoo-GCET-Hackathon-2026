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
  // accounts made before usernames were required have none, so fall back to the name or email
  const displayName =
    user?.username ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    '';

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        className='focus-visible:ring-primary-base rounded-full outline-none focus-visible:ring-2'
        aria-label='Profile menu'
      >
        {/* while Clerk loads the name is empty and Align shows its plain user icon instead of a letter */}
        <Avatar.Root size='32' color='gray'>
          {displayName.slice(0, 2).toUpperCase()}
        </Avatar.Root>
      </Dropdown.Trigger>
      <Dropdown.Content align='end' className='w-56'>
        <div className='px-2 py-1.5'>
          <p className='text-text-strong-950 truncate text-[15px] leading-[22px] font-medium'>
            {displayName}
          </p>
          <p className='text-text-sub-600 truncate text-[13px] leading-[18px]'>
            {user?.primaryEmailAddress?.emailAddress}
          </p>
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
