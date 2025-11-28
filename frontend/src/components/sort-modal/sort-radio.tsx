import React, { useCallback } from "react";
import { SortRadioProperties } from "./types";
import { useRouter } from "next/router";
import { omit } from "lodash";

const SortRadio = ({ item }: SortRadioProperties) => {
  const router = useRouter();
  const orderBy = router.query.orderBy || "lowest_price";
  const onRadioChange = useCallback(
    (value: string) => {
      const formattedQuery = omit(router.query, "sortModal");
      router.push({
        pathname: router.pathname,
        query: { ...formattedQuery, orderBy: value },
      });
    },
    [router]
  );
  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        onChange={(e) => {
          onRadioChange(e.target.value);
        }}
        id={item.value}
        name="sort"
        value={item.value}
        checked={item.value === orderBy}
        className="!w-5 !h-5"
      />

      <label
        htmlFor={item.value}
        className="flex items-center text-base font-medium"
      >
        {item.label}
      </label>
    </div>
  );
};

export default SortRadio;
