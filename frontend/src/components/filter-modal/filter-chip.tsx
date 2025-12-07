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
      className={`glass text-base px-5 py-3 rounded-xl font-semibold text-foreground flex items-center justify-center gap-2 w-full transition-all duration-300 hover:glow-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        filterCount > 0 ? 'gradient-primary text-primary-foreground glow-primary' : ''
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span>{`فیلتر ${filterCount ? `(${filterCount})` : ""}`}</span>
    </button>
  );
};

export default FilterChip;
