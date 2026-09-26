'use client';

import useSWR from 'swr';
import * as Select from '@/components/ui/select';
import { STATUS_LABEL } from '@/components/lists/StatusBadge';
import { fetcher } from '@/lib/fetcher';
import type { OpStatus } from '@/lib/types';

type Option = { value: string; label: string };
type Named = { id: string; name: string };
type Place = Named & { shortCode: string; fullName?: string };

// 'all' means no filter: a select item cannot have an empty value
export type DashboardFilters = {
  type: string;
  status: string;
  place: string; // 'wh:<id>' or 'loc:<id>'
  category: string;
};

export const NO_FILTERS: DashboardFilters = {
  type: 'all',
  status: 'all',
  place: 'all',
  category: 'all',
};

const TYPES: Option[] = [
  { value: 'IN', label: 'Receipts' },
  { value: 'OUT', label: 'Delivery' },
  { value: 'INT', label: 'Internal' },
  { value: 'ADJ', label: 'Adjustments' },
];

const STATUSES: Option[] = (Object.keys(STATUS_LABEL) as OpStatus[]).map(
  (s) => ({ value: s, label: STATUS_LABEL[s] }),
);

function FilterSelect({
  value,
  onChange,
  all,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  all: string;
  options: Option[];
}) {
  return (
    <Select.Root value={value} onValueChange={onChange} size='small'>
      <Select.Trigger className='w-full sm:w-44' aria-label={all}>
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value='all'>{all}</Select.Item>
        {options.map((o) => (
          <Select.Item key={o.value} value={o.value}>
            {o.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

// The PDF's dynamic filters: document type, status, warehouse or location, product category
export function FilterBar({
  filters,
  onChange,
}: {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}) {
  const { data: warehouses = [] } = useSWR<Place[]>('/api/warehouses', fetcher);
  const { data: locations = [] } = useSWR<Place[]>(
    '/api/locations?type=internal',
    fetcher,
  );
  const { data: categories = [] } = useSWR<Named[]>('/api/categories', fetcher);

  const places: Option[] = [
    ...warehouses.map((w) => ({
      value: `wh:${w.id}`,
      label: `${w.shortCode} (all locations)`,
    })),
    ...locations.map((l) => ({
      value: `loc:${l.id}`,
      label: l.fullName ?? l.name,
    })),
  ];
  const set = (key: keyof DashboardFilters) => (value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
      <FilterSelect
        value={filters.type}
        onChange={set('type')}
        all='All documents'
        options={TYPES}
      />
      <FilterSelect
        value={filters.status}
        onChange={set('status')}
        all='All statuses'
        options={STATUSES}
      />
      <FilterSelect
        value={filters.place}
        onChange={set('place')}
        all='All warehouses'
        options={places}
      />
      <FilterSelect
        value={filters.category}
        onChange={set('category')}
        all='All categories'
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
    </div>
  );
}

// Turns the select values into the /api/dashboard query string
export function toQuery(f: DashboardFilters) {
  const q = new URLSearchParams();
  if (f.type !== 'all') q.set('type', f.type);
  if (f.status !== 'all') q.set('status', f.status);
  if (f.place.startsWith('wh:')) q.set('warehouse', f.place.slice(3));
  if (f.place.startsWith('loc:')) q.set('location', f.place.slice(4));
  if (f.category !== 'all') q.set('category', f.category);
  return q.toString();
}
