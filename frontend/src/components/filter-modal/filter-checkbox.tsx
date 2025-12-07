import React, { useCallback } from 'react';
import { FilterCheckboxProperties } from './types';
import { useRouter } from 'next/router';

const FilterCheckbox = ({ item, name, label }: FilterCheckboxProperties) => {
  const router = useRouter();
  const filter = router.query[name];
  const onSelect = useCallback(
    (value: string) => {
      let filterList = (filter as string)?.split(',').filter(Boolean) || [];
      if (filterList?.includes(value)) {
        filterList = filterList.filter((item) => item !== value);
      } else {
        filterList.push(value);
      }
      
      const newQuery = { ...router.query };
      if (filterList.length > 0) {
        newQuery[name] = filterList.join(',');
      } else {
        delete newQuery[name];
      }
      
      router.push({
        pathname: router.pathname,
        query: newQuery,
      });
    },
    [filter, name, router]
  );
  
  const isChecked = (filter as string)?.split(',').filter(Boolean).includes(item) || false;
  
  return (
    <div className="flex items-center gap-3">
      <input
        onChange={(e) => onSelect(e.target.value)}
        type="checkbox"
        id={item}
        name={item}
        checked={isChecked}
        value={item}
        className="w-5 h-5 accent-primary cursor-pointer"
      />
      <label className="flex items-center text-sm font-medium cursor-pointer" htmlFor={item}>
        {label || item}
      </label>
    </div>
  );
};

export default FilterCheckbox;
