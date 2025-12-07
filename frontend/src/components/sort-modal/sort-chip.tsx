import { SortSchema } from "@/constants/sort-schema";
import { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";
import { SortChipProperties } from "./types";

const SortChip = ({ isDisabled }: SortChipProperties) => {
  const router = useRouter();
  const orderBy = router.query.orderBy || "lowest_price";
  const isActive = router.query.orderBy;
  const orderByLabel = useMemo(
    () => SortSchema.find((item) => item.value === orderBy)?.label,
    [orderBy]
  );
  const onClick = useCallback(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, sortModal: "true" },
    });
  }, [router]);
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={`glass text-base px-5 py-3 rounded-xl font-semibold text-foreground flex items-center justify-center gap-2 w-full transition-all duration-300 hover:glow-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'gradient-primary text-primary-foreground glow-primary' : ''
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <span>{isActive ? orderByLabel : "مرتب سازی"}</span>
    </button>
  );
};

export default SortChip;
