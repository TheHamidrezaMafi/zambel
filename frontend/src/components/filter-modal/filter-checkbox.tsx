import React, { useCallback } from 'react';
import { FilterCheckboxProperties } from './types';
import { useRouter } from 'next/router';

const FilterCheckbox = ({ item, name, label }: FilterCheckboxProperties) => {
  const router = useRouter();
  const filter = router.query[name];
  const onSelect = useCallback(
    (value: string) => {
      let filterList = (filter as string)?.split(',') || [];
      if (filterList?.includes(value)) {
        filterList = filterList.filter((item) => item !== value);
      } else {
        filterList.push(value);
      }
      router.push({
        pathname: router.pathname,
        query: { ...router.query, [name]: filterList.join(',') },
      });
    },
    [filter, name, router]
  );
  return (
    <div className="flex items-center gap-3">
      <input
        onChange={(e) => onSelect(e.target.value)}
        type="checkbox"
        id={item}
        name={item}
        checked={(filter as string)?.split(',').includes(item)}
        value={item}
        className="w-5 h-5"
      />
      <label className="flex items-center text-sm font-medium" htmlFor={item}>
        {label || item}
      </label>
    </div>
  );
};

export default FilterCheckbox;
