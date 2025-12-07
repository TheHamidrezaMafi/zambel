import { useRouter } from 'next/router';
import React from 'react';
import { TabsProps } from './types';
import Link from 'next/link';

const Tabs = ({
  list,
  defaultTab,
  variant = 'filled',
  queryKey,
}: TabsProps) => {
  const { query, pathname } = useRouter();
  const selectedTab = query[queryKey] || defaultTab;
  return (
    <div
      className={`flex w-full ${
        variant === 'filled' ? 'glass rounded-full p-1.5 inline-flex gap-1' : ''
      }`}
    >
      {list.map((item) => (
        <Link
          href={{
            pathname: pathname,
            query: { ...query, [queryKey]: item.value },
          }}
          key={item.value}
          className={`flex font-medium justify-center items-center min-h-10 md:min-h-11 w-full text-sm md:text-base transition-all duration-300 ${
            selectedTab === item.value
              ? variant === 'filled'
                ? 'gradient-primary text-primary-foreground rounded-full glow-primary'
                : 'border-b-2 border-primary text-primary'
              : variant === 'filled'
              ? 'text-muted-foreground hover:text-foreground rounded-full'
              : 'text-muted-foreground border-b-2 border-transparent hover:text-foreground'
          } ${
            item.disabled
              ? 'cursor-not-allowed pointer-events-none opacity-50'
              : ''
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Tabs;
