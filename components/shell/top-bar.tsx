'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RiArrowDownSLine } from '@remixicon/react';
import * as Dropdown from '@/components/ui/dropdown';
import { Logo } from '@/components/shell/logo';
import { MobileNav } from '@/components/shell/mobile-nav';
import { ProfileMenu } from '@/components/shell/profile-menu';
import { NAV, isActive, isGroup } from '@/components/shell/nav';
import { cn } from '@/utils/cn';

const itemClass = (active: boolean) =>
  cn(
    'inline-flex h-9 items-center gap-1 rounded-10 px-3 text-[15px] leading-[22px] transition-colors duration-150',
    active ? 'bg-bg-weak-50 font-medium text-text-strong-950' : 'text-text-sub-600 hover:text-text-strong-950',
  );

// The mockup top bar: nav on the left, avatar on the right. Below 768px the nav moves into the drawer.
export function TopBar() {
  const pathname = usePathname();

  return (
    <header className='sticky top-0 z-40 border-b border-stroke-soft-200 bg-bg-white-0'>
      <div className='mx-auto flex h-14 w-full max-w-[1200px] items-center gap-2 px-4 md:gap-6 md:px-8'>
        <MobileNav />
        <Link href='/' aria-label='StockSense home'>
          <Logo />
        </Link>

        <nav className='hidden items-center gap-1 md:flex' aria-label='Main'>
          {NAV.map((item) =>
            isGroup(item) ? (
              <Dropdown.Root key={item.label}>
                <Dropdown.Trigger className={cn(itemClass(isActive(pathname, item)), 'outline-none')}>
                  {item.label}
                  <RiArrowDownSLine className='size-4' aria-hidden />
                </Dropdown.Trigger>
                <Dropdown.Content align='start' className='w-52'>
                  {item.children.map((child) => (
                    <Dropdown.Item key={child.href} asChild>
                      <Link href={child.href} className={cn(isActive(pathname, child) && 'font-medium text-primary-base')}>
                        {child.label}
                      </Link>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Content>
              </Dropdown.Root>
            ) : (
              <Link key={item.href} href={item.href} className={itemClass(isActive(pathname, item))}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className='ml-auto flex items-center gap-3'>
          {/* the low stock bell (alerts) mounts here */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
