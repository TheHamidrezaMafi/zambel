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
        variant === 'filled' ? 'p-1 rounded-lg md:rounded-xl border border-border bg-muted/20' : ''
      }`}
    >
      {list.map((item) => (
        <Link
          href={{
            pathname: pathname,
            query: { ...query, [queryKey]: item.value },
          }}
          key={item.value}
          className={`flex font-medium justify-center items-center min-h-10 md:min-h-11 w-full text-sm md:text-base transition-all ${
            selectedTab === item.value
              ? variant === 'filled'
                ? 'text-primary-foreground rounded-md md:rounded-lg bg-primary shadow-sm'
                : 'border-b-2 border-primary text-primary'
              : variant === 'filled'
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground border-b-2 border-transparent hover:border-muted-foreground/20'
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
