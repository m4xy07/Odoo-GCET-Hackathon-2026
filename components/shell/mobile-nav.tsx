'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { RiMenuLine } from '@remixicon/react';
import * as Drawer from '@/components/ui/drawer';
import { Logo } from '@/components/shell/logo';
import { NAV, isActive, isGroup, type NavLink } from '@/components/shell/nav';
import { cn } from '@/utils/cn';

// Phones get a left drawer with the same links, plus the profile menu (where the problem statement puts it)
export function MobileNav() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [open, setOpen] = React.useState(false);

  const link = (item: NavLink, indent = false) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={cn(
        'flex h-11 items-center rounded-10 px-3 text-[15px]',
        indent && 'pl-6',
        isActive(pathname, item) ? 'bg-bg-weak-50 font-medium text-text-strong-950' : 'text-text-sub-600',
      )}
    >
      {item.label}
    </Link>
  );

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className='flex size-9 items-center justify-center rounded-10 text-text-strong-950 md:hidden' aria-label='Open menu'>
        <RiMenuLine className='size-5' />
      </Drawer.Trigger>
      {/* Align's drawer slides in from the right, these classes flip it to the left */}
      <Drawer.Content
        className={cn(
          'max-w-[300px] justify-self-start border-l-0 border-r',
          'data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full',
        )}
      >
        <Drawer.Header>
          <Drawer.Title>
            <Logo />
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className='flex flex-col gap-1 px-3 pb-6'>
          {NAV.map((item) =>
            isGroup(item) ? (
              <div key={item.label} className='mt-2'>
                <p className='px-3 pb-1 text-[13px] font-medium uppercase tracking-wide text-text-soft-400'>{item.label}</p>
                {item.children.map((child) => link(child, true))}
              </div>
            ) : (
              link(item)
            ),
          )}
          <div className='mt-4 border-t border-stroke-soft-200 pt-4'>
            {link({ label: 'My Profile', href: '/profile' })}
            <button
              type='button'
              onClick={() => signOut({ redirectUrl: '/sign-in' })}
              className='flex h-11 w-full items-center rounded-10 px-3 text-[15px] text-error-base'
            >
              Logout
            </button>
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
}
