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
      className={`bg-card border-2 border-border disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:border-muted text-base px-5 py-3 rounded-xl font-semibold text-foreground flex items-center justify-center w-full transition-all duration-200 hover:border-primary hover:shadow-md active:scale-95 ${
        isActive ? 'border-primary bg-primary/5' : ''
      }`}
    >
      {isActive ? orderByLabel : "مرتب سازی"}
    </button>
  );
};

export default SortChip;
