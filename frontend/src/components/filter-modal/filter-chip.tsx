import { useFilterCount } from "@/hooks/useFilters";
import { useRouter } from "next/router";
import React, { useCallback } from "react";
import { FilterChipProperties } from "./types";

const FilterChip = ({ isDisabled }: FilterChipProperties) => {
  const router = useRouter();

  const filterCount = useFilterCount();

  const onClick = useCallback(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, filterModal: "true" },
    });
  }, [router]);
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={`bg-card border-2 border-border disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:border-muted text-base px-5 py-3 rounded-xl font-semibold text-foreground flex items-center justify-center w-full transition-all duration-200 hover:border-primary hover:shadow-md active:scale-95 ${
        filterCount > 0 ? 'border-primary bg-primary/5' : ''
      }`}
    >
      {`فیلتر ${filterCount ? `(${filterCount})` : ""}`}
    </button>
  );
};

export default FilterChip;
