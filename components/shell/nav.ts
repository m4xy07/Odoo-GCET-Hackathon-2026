// Every page in the app, in the order of the mockup top bar. The desktop bar and the mobile drawer both read this.

export type NavLink = { label: string; href: string };
export type NavGroup = { label: string; children: NavLink[] };
export type NavItem = NavLink | NavGroup;

export const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  {
    label: 'Operations',
    children: [
      { label: 'Receipts', href: '/operations/receipts' },
      { label: 'Deliveries', href: '/operations/deliveries' },
      { label: 'Internal Transfers', href: '/operations/transfers' },
      { label: 'Adjustments', href: '/operations/adjustments' },
    ],
  },
  {
    label: 'Products',
    children: [
      { label: 'Products', href: '/products' },
      { label: 'Stock', href: '/stock' },
    ],
  },
  { label: 'Move History', href: '/moves' },
  {
    label: 'Settings',
    children: [
      { label: 'Warehouses', href: '/settings/warehouses' },
      { label: 'Locations', href: '/settings/locations' },
    ],
  },
];

export const isGroup = (item: NavItem): item is NavGroup => 'children' in item;

// "/" only matches itself, every other link also matches its sub pages (/operations/receipts/123)
export function isActive(pathname: string, item: NavItem): boolean {
  if (isGroup(item)) return item.children.some((child) => isActive(pathname, child));
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
