'use client';

import { useEffect, useState } from 'react';
import { RiSearch2Line } from '@remixicon/react';
import * as Input from '@/components/ui/input';

const DEBOUNCE_MS = 250;

// Waits for a short pause in typing before searching, so the API is not called on every key
export function SearchBar({
  onSearch,
  placeholder,
}: {
  onSearch: (query: string) => void;
  placeholder: string;
}) {
  const [text, setText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <Input.Root size='small' className='w-full sm:w-64'>
      <Input.Wrapper>
        <Input.Icon as={RiSearch2Line} />
        <Input.Input
          type='search'
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </Input.Wrapper>
    </Input.Root>
  );
}
